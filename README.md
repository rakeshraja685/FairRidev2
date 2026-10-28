# FairRide (தமிழ்நாடு ஆட்டோ கட்டணக் கணக்கீடு)

<p align="center">
  <strong>The Open-Source, Community-Driven Auto-Rickshaw Fare Transparency Utility for Tamil Nadu</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tariff-2026%20Statutory%20Rules-amber?style=for-the-badge" alt="Tariff" />
  <img src="https://img.shields.io/badge/Coverage-Tamil%20Nadu%20(Urban%20%26%20Rural)-blue?style=for-the-badge" alt="Coverage" />
  <img src="https://img.shields.io/badge/PWA-Offline%20Ready-green?style=for-the-badge" alt="PWA" />
  <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" alt="License" />
</p>

---

## 📖 Overview & Purpose

In Tamil Nadu, auto-rickshaw fares often become a source of daily friction between commuters and drivers due to uncalibrated physical meters, arbitrary surge pricing from private aggregator apps (Ola, Uber, Rapido), and lack of awareness regarding legally notified government tariffs.

**FairRide** solves this problem by providing a fast, transparent, mobile-first **Progressive Web App (PWA)** that:
1. Calculates statutory fares under both the **27 October 2026 Government Notification** and the legacy 2013 rules (**G.O. Ms. No. 611**).
2. Works completely **free** without expensive API keys, covering both major metropolitan hubs (Chennai, Coimbatore, Madurai, Trichy, Salem) and **remote rural villages, taluks, and hamlets**.
3. Empowers both **passengers and auto drivers** with mutual dispute-settlement tools (Driver Mode, Quote Checker, and Recalibration Converter).

---

## 🛺 Key Features

### 1. 🧮 Answer-First Fare Calculator
- **Statutory Tariff Engine**: Computes minimum base fare (up to 1.8 km), additional distance charge (₹25/km), waiting time charges, and night surcharges (10:00 PM to 5:00 AM, 1.5×).
- **2013 vs 2026 Comparison**: Displays exact delta in rupees (+₹) and percentage (+%) so passengers see how the new legal fare compares to the older baseline.
- **Deep Rural & Urban Search**: Integrated with free OpenStreetMap & Photon geocoding with instant offline fallback. Search any village (e.g. *Uthiramerur*, *Acharapakkam*, *Cheyyar*) or Chennai landmark in both English and native Tamil script (e.g. *உத்திரமேரூர்*).
- **Live Driving Route Resolution**: Resolves exact driving road distances via open routing (OSRM) with straight-line fallback.
- **Interactive Map**: Renders route geometry and draggable pins using MapLibre GL.

### 2. ❓ "Driver Asked?" Quote Checker
- **Real-Time Fare Compliance**: Type the price an auto driver quoted to instantly receive a color-coded statutory verdict:
  - 🟢 **Fair**: Quote is at or below the legal government rate.
  - 🟡 **Close**: Within normal round-off or route variation tolerance (≤ 8%).
  - 🔴 **Too High / Overcharged**: Exceeds legal statutory rate with exact excess (+₹ and +%).
- **Interactive Trip Distance Selector**: Adjust trip distance on the fly with quick-pick chips (`2 km`, `3 km`, `5 km`, `8 km`, `10 km`, `15 km`) or custom input without leaving the tab.
- **Passenger Negotiation Advice**: Displays polite, de-escalating dialogue suggestions in Tamil and English (e.g. *"அரசு சட்டப்பூர்வ மீட்டர் கட்டணம் ₹X தான் வரும். மீட்டர்படி போடுங்க அண்ணா"*).
- **RTO Grievance Reporting**: Pre-fills an official complaint template with trip details, vehicle number, and excess fare charged for submission to Regional Transport Offices (RTOs).

### 3. 🚕 Driver Mode (For Auto Drivers)
- **High-Contrast Digital Billboard Card**: Designed specifically for drivers to place their phone on their dashboard or show passengers to establish credibility and prevent arguments.
- **Typeable Trip Distance**: Large, direct numeric input with `[-]` and `[+]` quick-adjustment buttons.
- **Instant Statutory Tariff**: Automatically calculates day and night rates per official meter rules.

### 4. 📟 Old Meter Recalibration Converter
- If an auto's physical meter has not yet been electronically recalibrated and still displays the 2013 fare, passengers and drivers can enter the physical meter reading to reverse-calculate the exact distance traveled and current legal 2026 payable amount.

### 5. 📱 Private App Price Comparison
- Compare dynamic surge quotes from private ride-hailing apps (Ola Auto, Uber Auto, Rapido) side-by-side against the legal metered rate.

### 6. 📊 Complete Offline Fare Chart (1 to 30 km)
- Comprehensive lookup table listing day fares, night fares, and legacy comparisons accessible 100% offline.

### 7. 🌐 Accessibility & Inclusive Design
- **Bilingual Interface**: Seamless one-tap toggle between **Tamil (தமிழ்)** and **English**.
- **Dark & Light Mode**: Tailored for day-time readability and glare-free night commuting, with instant class-based theme switching.
- **Larger Text Mode (`Aa`)**: Enhances legibility for elderly passengers and auto drivers.
- **PWA (Progressive Web App)**: Installable directly on Android, iOS, and Desktop with offline caching via Service Worker.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling** | Tailwind CSS v4, Lucide Icons, Glassmorphism & Adaptive Dark Mode |
| **Mapping & Routing** | MapLibre GL, Project OSRM (Live Driving Routes), Haversine Fallback |
| **Geocoding & Search** | Photon (Komoot/OSM) + OpenStreetMap Nominatim + Fuse.js (Offline Landmarks) |
| **Localization** | i18next, react-i18next (Tamil & English) |
| **Offline / PWA** | `vite-plugin-pwa`, Workbox Service Worker, Web App Manifest |
| **Unit Testing** | Vitest (Verifying statutory tariff calculations) |

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (v9 or higher)

### 1. Clone the repository
```bash
git clone https://github.com/rakeshraja685/FairRidev2.git
cd FairRidev2
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Build for production
```bash
npm run build
```
The compiled, production-ready static assets and service worker will be generated in the `dist/` directory.

### 5. Run automated tests
```bash
npm test
```

---

## 📐 Statutory Tariff Rules Reference

Tariffs are centrally maintained in [`src/fare/rates.json`](src/fare/rates.json):

| Tariff Component | 2013 Tariff (G.O. Ms. No. 611) | 2026 Revised Tariff (Gazette Notification) |
|---|---|---|
| **Minimum Base Fare** | ₹25.00 (first 1.8 km) | ₹50.00 (first 1.8 km) |
| **Per Kilometer Rate** | ₹12.00 / km | ₹25.00 / km |
| **Waiting Charges** | ₹3.50 per 5 minutes | ₹1.00 per minute |
| **Night Surcharge** | +50% (11:00 PM to 5:00 AM) | +50% (10:00 PM to 5:00 AM) |
| **Hill Road (Ghat)** | Not standard | +20% (₹60 base, ₹30/km) |

---

## ⚖️ Legal & Non-Affiliation Disclaimer

FairRide is a public transit utility developed by and for the community. It is **not operated by, affiliated with, or endorsed by the Government of Tamil Nadu or the State Transport Authority**. All fare computations strictly follow published statutory government rules and notifications. In all cases, the vehicle meter and official government gazette notices remain the final legal authority.

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
