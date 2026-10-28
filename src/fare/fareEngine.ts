import ratesData from './rates.json';

export interface RatesConfig {
  asOf: string;
  old: {
    base: number;
    baseKm: number;
    perKm: number;
    waitBlockMin: number;
    waitBlockFare: number;
    nightFrom: number;
    nightTo: number;
    nightMult: number;
  };
  new: {
    base: number;
    baseKm: number;
    perKm: number;
    waitPerMin: number;
    nightFrom: number;
    nightTo: number;
    nightMult: number;
    ghat: {
      base: number;
      perKm: number;
    };
  };
}

export const rates: RatesConfig = ratesData as RatesConfig;

export interface FareBreakdown {
  min: number;
  extra: number;
  wait: number;
  nightExtra: number;
  total: number;
}

export interface FareInput {
  km: number;
  waitMin?: number;
  night?: boolean;
  ghat?: boolean;
}

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Checks if a given time HH:MM falls into the night tariff window.
 * Returns true if time >= from:00 or time < to:00.
 */
export function isNight(time: string, from: number, to: number): boolean {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const totalMinutes = h * 60 + m;
  const fromMinutes = from * 60;
  const toMinutes = to * 60;

  if (from > to) {
    // Overnight period, e.g. 23:00 to 05:00 or 22:00 to 05:00
    return totalMinutes >= fromMinutes || totalMinutes < toMinutes;
  } else {
    return totalMinutes >= fromMinutes && totalMinutes < toMinutes;
  }
}

/**
 * Calculates 2013 legacy fare under G.O. Ms. No. 611:
 * F_2013 = (25 + max(0, km - 1.8) * 12 + floor(waitMin / 5) * 3.5) * (night ? 1.5 : 1)
 */
export function oldFare({
  km,
  waitMin = 0,
  night = false
}: {
  km: number;
  waitMin?: number;
  night?: boolean;
}): FareBreakdown {
  const base = rates.old.base;
  const baseKm = rates.old.baseKm;
  const perKm = rates.old.perKm;
  const waitBlockMin = rates.old.waitBlockMin;
  const waitBlockFare = rates.old.waitBlockFare;
  const nightMult = rates.old.nightMult;

  const min = round2(base);
  const extra = round2(Math.max(0, km - baseKm) * perKm);
  const wait = round2(Math.floor(waitMin / waitBlockMin) * waitBlockFare);
  const daySubtotal = round2(min + extra + wait);
  const nightExtra = night ? round2(daySubtotal * (nightMult - 1)) : 0;
  const total = night ? round2(daySubtotal * nightMult) : daySubtotal;

  return {
    min,
    extra,
    wait,
    nightExtra,
    total
  };
}

/**
 * Calculates 2026 revised fare (notified 27 Oct 2026):
 * F_2026 = (50 + max(0, km - 1.8) * 25 + waitMin * 1) * (night ? 1.5 : 1)
 * If ghat road: base = 60, perKm = 30.
 */
export function newFare({
  km,
  waitMin = 0,
  night = false,
  ghat = false
}: {
  km: number;
  waitMin?: number;
  night?: boolean;
  ghat?: boolean;
}): FareBreakdown {
  const base = ghat ? rates.new.ghat.base : rates.new.base;
  const perKm = ghat ? rates.new.ghat.perKm : rates.new.perKm;
  const baseKm = rates.new.baseKm;
  const waitPerMin = rates.new.waitPerMin;
  const nightMult = rates.new.nightMult;

  const min = round2(base);
  const extra = round2(Math.max(0, km - baseKm) * perKm);
  const wait = round2(waitMin * waitPerMin);
  const daySubtotal = round2(min + extra + wait);
  const nightExtra = night ? round2(daySubtotal * (nightMult - 1)) : 0;
  const total = night ? round2(daySubtotal * nightMult) : daySubtotal;

  return {
    min,
    extra,
    wait,
    nightExtra,
    total
  };
}

/**
 * Calculates fair fare range across route options.
 * low = newFare at smallest distance, high = newFare at largest distance * 1.05.
 */
export function fareRange(
  distancesKm: number[],
  inputs: Omit<FareInput, 'km'> = {}
): { low: number; high: number } {
  if (!distancesKm || distancesKm.length === 0) {
    return { low: 0, high: 0 };
  }
  const minKm = Math.min(...distancesKm);
  const maxKm = Math.max(...distancesKm);

  const low = newFare({ ...inputs, km: minKm }).total;
  const maxBase = newFare({ ...inputs, km: maxKm }).total;
  const high = round2(maxBase * 1.05);

  return {
    low,
    high
  };
}

export type OldMeterResult =
  | {
      valid: true;
      km: number;
      newFare: number;
      breakdown: FareBreakdown;
    }
  | {
      valid: false;
      error: 'invalid';
    };

/**
 * Converts old meter reading to equivalent distance and 2026 fare:
 * If night: divide meter by 1.5.
 * Subtract floor(waitMin / 5) * 3.5.
 * If result < 25 return invalid.
 * km = 1.8 + (result - 25) / 12 (km = 1.8 when result is exactly 25).
 * returns km and newFare for that km.
 */
export function oldMeterToNew({
  meter,
  waitMin = 0,
  night = false,
  ghat = false
}: {
  meter: number;
  waitMin?: number;
  night?: boolean;
  ghat?: boolean;
}): OldMeterResult {
  let reading = meter;
  if (night) {
    reading = reading / rates.old.nightMult;
  }
  const waitCharge = Math.floor(waitMin / rates.old.waitBlockMin) * rates.old.waitBlockFare;
  const result = round2(reading - waitCharge);

  if (result < rates.old.base) {
    return { valid: false, error: 'invalid' };
  }

  const km = round2(rates.old.baseKm + (result - rates.old.base) / rates.old.perKm);
  const fare = newFare({ km, waitMin, night, ghat });

  return {
    valid: true,
    km,
    newFare: fare.total,
    breakdown: fare
  };
}

export type QuoteVerdict = 'fair' | 'close' | 'overcharged';

export interface QuoteCheckResult {
  verdict: QuoteVerdict;
  amountOver: number;
  percentOver: number;
}

/**
 * Checks driver's quoted price against expected and upper limit fares:
 * <= expected : fair
 * expected < quote <= limit : close
 * > limit : overcharged
 */
export function checkQuote(quote: number, expected: number, limit: number): QuoteCheckResult {
  if (quote <= expected) {
    return {
      verdict: 'fair',
      amountOver: 0,
      percentOver: 0
    };
  } else if (quote <= limit) {
    const amountOver = round2(quote - expected);
    const percentOver = round2(((quote - expected) / expected) * 100);
    return {
      verdict: 'close',
      amountOver,
      percentOver
    };
  } else {
    const amountOver = round2(quote - expected);
    const percentOver = round2(((quote - expected) / expected) * 100);
    return {
      verdict: 'overcharged',
      amountOver,
      percentOver
    };
  }
}

/**
 * Formats a currency amount: whole numbers without decimals (e.g. ₹255),
 * decimal numbers with 2 decimals (e.g. ₹123.40).
 */
export function formatFare(amount: number): string {
  if (amount % 1 === 0) {
    return `₹${amount.toFixed(0)}`;
  }
  return `₹${amount.toFixed(2)}`;
}
