import { describe, it, expect } from 'vitest';
import {
  isNight,
  oldFare,
  newFare,
  fareRange,
  oldMeterToNew,
  checkQuote,
  formatFare,
  rates
} from './fareEngine';

describe('FairRide Fare Engine Tests', () => {
  it('10 km day: old 123.40, new 255', () => {
    const oldResult = oldFare({ km: 10, waitMin: 0, night: false });
    const newResult = newFare({ km: 10, waitMin: 0, night: false, ghat: false });

    expect(oldResult.total).toBe(123.40);
    expect(newResult.total).toBe(255);
  });

  it('10 km night: old 185.10, new 382.50', () => {
    const oldResult = oldFare({ km: 10, waitMin: 0, night: true });
    const newResult = newFare({ km: 10, waitMin: 0, night: true, ghat: false });

    expect(oldResult.total).toBe(185.10);
    expect(newResult.total).toBe(382.50);
  });

  it('4.8 km day: old 61, new 125', () => {
    const oldResult = oldFare({ km: 4.8, waitMin: 0, night: false });
    const newResult = newFare({ km: 4.8, waitMin: 0, night: false, ghat: false });

    expect(oldResult.total).toBe(61);
    expect(newResult.total).toBe(125);
  });

  it('1 km with 9 minutes waiting: old 28.50, new 59', () => {
    const oldResult = oldFare({ km: 1, waitMin: 9, night: false });
    const newResult = newFare({ km: 1, waitMin: 9, night: false, ghat: false });

    expect(oldResult.total).toBe(28.50);
    expect(newResult.total).toBe(59);
  });

  it('10 km ghat day: new 306', () => {
    const newResult = newFare({ km: 10, waitMin: 0, night: false, ghat: true });

    expect(newResult.total).toBe(306);
  });

  it('10 km with 5 minutes waiting, day: old 126.90, new 260', () => {
    const oldResult = oldFare({ km: 10, waitMin: 5, night: false });
    const newResult = newFare({ km: 10, waitMin: 5, night: false, ghat: false });

    expect(oldResult.total).toBe(126.90);
    expect(newResult.total).toBe(260);
  });

  it('isNight at 22:30 is true for the new tariff window and false for the old; 04:59 is night; 05:00 is not', () => {
    // New window: 22 to 5
    expect(isNight('22:30', rates.new.nightFrom, rates.new.nightTo)).toBe(true);
    // Old window: 23 to 5
    expect(isNight('22:30', rates.old.nightFrom, rates.old.nightTo)).toBe(false);

    // 04:59 is night in both windows
    expect(isNight('04:59', rates.new.nightFrom, rates.new.nightTo)).toBe(true);
    expect(isNight('04:59', rates.old.nightFrom, rates.old.nightTo)).toBe(true);

    // 05:00 is day in both windows
    expect(isNight('05:00', rates.new.nightFrom, rates.new.nightTo)).toBe(false);
    expect(isNight('05:00', rates.old.nightFrom, rates.old.nightTo)).toBe(false);
  });

  it('oldMeterToNew with meter 126.90 and 5 minutes waiting: km 10, new fare 260', () => {
    const result = oldMeterToNew({ meter: 126.90, waitMin: 5, night: false });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.km).toBe(10);
      expect(result.newFare).toBe(260);
    }
  });

  it('oldMeterToNew with meter 25: new fare 50; meter 20: invalid', () => {
    const validResult = oldMeterToNew({ meter: 25, waitMin: 0, night: false });
    expect(validResult.valid).toBe(true);
    if (validResult.valid) {
      expect(validResult.km).toBe(1.8);
      expect(validResult.newFare).toBe(50);
    }

    const invalidResult = oldMeterToNew({ meter: 20, waitMin: 0, night: false });
    expect(invalidResult.valid).toBe(false);
    if (!invalidResult.valid) {
      expect(invalidResult.error).toBe('invalid');
    }
  });

  it('checkQuote categorizes fares correctly into fair, close, or overcharged', () => {
    const expected = 255;
    const limit = 275;

    // Driver asks 250 (<= expected)
    expect(checkQuote(250, expected, limit).verdict).toBe('fair');
    expect(checkQuote(255, expected, limit).verdict).toBe('fair');

    // Driver asks 265 (expected < quote <= limit)
    const closeRes = checkQuote(265, expected, limit);
    expect(closeRes.verdict).toBe('close');
    expect(closeRes.amountOver).toBe(10);

    // Driver asks 300 (> limit)
    const overRes = checkQuote(300, expected, limit);
    expect(overRes.verdict).toBe('overcharged');
    expect(overRes.amountOver).toBe(45);
    expect(overRes.percentOver).toBe(17.65);
  });

  it('fareRange calculates lowest fare and highest route with +5% tolerance', () => {
    const range = fareRange([10, 10.5]);
    expect(range.low).toBe(255);
    // 10.5 km: 50 + (10.5 - 1.8)*25 = 50 + 217.5 = 267.5; 267.5 * 1.05 = 280.875 -> 280.88
    expect(range.high).toBe(280.88);
  });

  it('formatFare displays whole numbers without decimals and fractional with decimals', () => {
    expect(formatFare(255)).toBe('₹255');
    expect(formatFare(123.40)).toBe('₹123.40');
    expect(formatFare(382.5)).toBe('₹382.50');
  });
});
