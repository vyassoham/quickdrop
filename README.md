# ⚡ QuickDrop — On-Demand Delivery & Fleet Management Platform

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26.svg?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6.svg?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**QuickDrop** is a modern on-demand delivery tracking and logistics fleet management Single Page Application (SPA). Designed for logistics operators and customers, it delivers real-time order tracking, dynamic driver fleet dispatch, delivery route milestones, and live analytics.

---

## 🌟 Key Features

- **📍 Live Order Tracking:** Real-time visual timeline showing order confirmation, driver pickup, in-transit status, and delivery completion.
- **🛵 Fleet & Driver Dispatch:** Interactive driver assignment panel monitoring active drivers, battery levels, delivery load, and live coordinates.
- **📊 Analytics Dashboard:** Visual KPI cards tracking total deliveries, average delivery time, customer satisfaction rating, and revenue.
- **⚡ Zero-Dependency Vanilla Architecture:** Built with pure ES6+ JavaScript, semantic HTML5, and responsive CSS3 for lightning-fast load times.
- **📱 Fully Responsive:** Optimized for desktop dispatchers, warehouse tablets, and mobile delivery agents.

---

## 📂 Repository Structure

```
quickdrop/
├── README.md                # Project documentation & quickstart guide
└── quickdrop-site/          # Core web application
    ├── index.html           # Main semantic HTML5 single-page application
    ├── style.css            # Dark/glassmorphic responsive stylesheet
    ├── app.js               # Application logic, tab switching & DOM events
    └── data.js              # Mock shipment, driver & order datasets
```

---

## 🚀 Quick Start Guide

No build step or package manager required!

### Option 1: Direct Browser Launch
1. Clone the repository:
   ```bash
   git clone https://github.com/vyassoham/quickdrop.git
   cd quickdrop
   ```
2. Open `quickdrop-site/index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).

### Option 2: Local HTTP Server
Using Python's built-in static server:
```bash
cd quickdrop/quickdrop-site
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
