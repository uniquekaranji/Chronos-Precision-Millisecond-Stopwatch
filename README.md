# Chronos — Precision Millisecond Stopwatch ⏱️

A modern, horological-grade millisecond stopwatch and lap telemetry studio built with **HTML5**, **CSS3**, and **Vanilla ES6+ JavaScript** for the **Ignite Club Week 9 Web Development Mission (Project 2)**.

## ✨ Key Features

- **Drift-Free Millisecond Accuracy**: Powered by `performance.now()` and `requestAnimationFrame` for true `00:00.000` millisecond precision without `setInterval` timer drift.
- **Complete Chronometer Controls**:
  - **Start**: Initiates high-frequency timing loop.
  - **Pause**: Freezes exact elapsed millisecond state.
  - **Resume**: Seamlessly continues timing from the paused offset.
  - **Lap**: Logs individual lap split time, cumulative elapsed time, and delta against average pace.
  - **Reset**: Clears the chronograph dial and resets lap telemetry.
- **Dual Concentric SVG Progress Rings**: Outer ring tracks the 60-second primary sweep; inner ring tracks the current active lap split.
- **Live Lap Telemetry & Pace Analytics**:
  - Automatic **Fastest** and **Slowest** lap badges.
  - Real-time KPI summary cards: **Total Laps**, **Fastest Lap**, **Slowest Lap**, and **Average Split**.
  - **One-Click Copy** & **CSV Export** for external analysis.
- **Synthesized Tactile Audio & Keyboard Shortcuts**:
  - Built-in Web Audio API click feedback (with mute toggle).
  - Full keyboard control: `Space` (Start/Pause/Resume), `L` (Lap), `R` (Reset), and `M` (Mute).
- **Dark & Light Studio Themes**: Switch effortlessly between Horological Dark Mode and Daylight Studio Mode.

## 📁 Folder Structure

```text
WEEK-9/Stopwatch/
├── index.html   # Semantic HTML5 layout, SVG concentric rings & analytics table
├── style.css    # Custom CSS3 variables, glassmorphism, animations & responsive grid
├── script.js    # High-precision performance.now() timing engine & CSV/Clipboard export
└── README.md    # Project documentation
```

## 🚀 How to Run Locally

1. Clone or unzip the `WEEK-9/Stopwatch/` folder.
2. Open `index.html` directly in any modern web browser, or serve locally:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
3. Press **Start** (or hit `Space`), record splits with **Lap** (`L`), and export your session via **Copy** or **Export CSV**.
