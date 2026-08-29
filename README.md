# Fishing Engineer's Calculator V5.0

V5.0 is a modular, GitHub Pages-ready tubular engineering build.

## Tubular selector
Search flow:
**Category → Size → Weight → Grade → Connection**

Categories included:
- Tubing
- Drill Pipe
- HWDP
- Drill Collars

Selecting a record auto-populates:
- OD
- ID
- wall thickness
- drift ID where available
- nominal linear weight
- grade
- SMYS
- tensile strength reference
- connection
- tool-joint OD/ID where relevant
- body metal area
- calculated pipe-body yield
- source / standard field

## Architecture
- `js/data/tubular-library.js` — independent tubular database
- `js/modules/string-bha.js` — tally calculations
- `js/modules/tubular-strength.js` — strength calculations
- `js/modules/fishing-loads.js` — fishing load calculations
- `js/units.js` — FPS/Metric conversion
- `js/app.js` — UI orchestration only

## Standards/version note
The UI records the intended governing standard family for each record. API's current public information states that API Spec 5CT is at 11th Edition, and API lists Addendum 1 (May 2025) and Errata 3 (June 2026). Drill pipe is governed by API Spec 5DP, while rotary shouldered connections are associated with API 7-2. Users should verify the exact licensed editions adopted by their organization.

## Critical database warning
The included dataset is a **curated starter engineering library**, not a licensed reproduction of proprietary API tables or a manufacturer-certified tubular catalogue. Dimensions, drift, weight, grades, connection ratings, torque, collapse, burst and tensile values required for an actual job must be checked against the field tally, manufacturer data and applicable licensed standard before use.


## V5.1 Volumes & Pump Strokes
Independent module: `js/modules/volumes.js`

Calculates total annulus volume, string internal volume, total well volume, metal displacement, and pump strokes for total well/string/annulus volumes. Uses the existing String/BHA tally plus hole/casing sections. Pump strokes use effective pump displacement = theoretical displacement × pump efficiency.


## V5.2 — Balanced Pill Spotting module
Independent module: `js/modules/spotting.js`

Inputs:
- drilling fluid type, MW, PV, YP
- spotting fluid/pill type, MW, PV, YP
- hole/casing ID
- pipe OD and ID
- spotted column
- TVD
- pump rate
- pipe friction increment
- annular friction increment
- surface backpressure

Outputs:
- balanced pill volume required
- displacement volume
- total volume to pump
- annular pill volume
- loss/gain of hydrostatic head
- expected extra pump pressure
- estimated pump time

The module intentionally labels the calculation as a screening model. Actual spotting programs should use segmented fluid columns, actual MD/TVD placement, full string geometry, dynamic friction/ECD, pump calibration, compatibility checks and operating pressure limits.


## V5.3 — Segmented Balanced Pill Spotting
Upgraded `js/modules/spotting.js` to use:
- actual pill top/bottom MD
- actual pill top/bottom TVD
- Hole/Casing Sections from Volumes module
- variable OD/ID from the String/BHA tally
- piecewise annular and internal volumes
- displacement volume from surface to pill top
- hydrostatic contribution of the spotted TVD interval
- BHP before and after spotting
- expected additional pump pressure from density increment + user-entered friction/backpressure

This is significantly more representative than a single-geometry spotting model, but dynamic friction/ECD remains user-entered rather than being derived from a full rheology/hydraulics solver.


## V5.4 — Mobile Deployment
UI-only mobile optimization; calculation logic is unchanged.

Improvements:
- sticky mobile header
- hamburger navigation drawer
- touch-friendly controls
- single-column forms on phones
- responsive KPI/result cards
- horizontal swipe for large tally tables
- improved small-screen typography and spacing
- iOS safe-area handling
- web app manifest for Add to Home Screen
- GitHub Pages compatibility
