# BigQuery Release Notes Tracker

A sleek, responsive, and modern Python Flask web application that parses the official Google Cloud BigQuery Release Notes RSS/Atom feed and renders them in an elegant glassmorphism feed. The app splits complex multi-part daily updates into isolated, searchable cards and offers interactive Tweet composer integrations (including tweet-on-selection functionality).

## 🚀 Key Features

*   **Live XML Atom Feed Parsing**: Dynamically fetches and parses the latest release notes directly from Google.
*   **Granular Update Segmenter**: Splits daily updates into standalone items categorized by type: **Feature**, **Change**, **Deprecated**, and **General**.
*   **Live Search & Sidebar Filters**: Instantly filters notes by type or matches search query strings locally.
*   **Glassmorphic Design**: Sleek dark-mode aesthetic with custom animations, loading states, and colorful visual accents.
*   **X/Twitter Composer Modal**: Integrates a Twitter Web Intent modal with a 280 character limit tracker, automatic truncation, and back-link integration.
*   **Highlight/Select-to-Tweet**: Custom Javascript utility that listens for text selection inside cards to show a floating "Tweet Selection" shortcut.

---

## 🛠️ Tech Stack

*   **Backend**: Python Flask, `requests`
*   **Frontend**: Vanilla HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 (custom layouts & animations)
*   **Icons**: FontAwesome 6

---

## 📦 Directory Structure

```text
bq-releases-notes/
├── static/
│   ├── app.js         # Client-side filtering, DOM parsing, & event listeners
│   └── style.css      # Dark mode variables, glassmorphic layout, & keyframes
├── templates/
│   └── index.html     # HTML skeleton, sidebar, modal layout
├── app.py             # Flask Server entry point & XML API Proxy
├── requirements.txt   # App dependencies
└── .gitignore         # Excluded files
```

---

## ⚡ Quick Start (Local Setup)

### 1. Clone/Navigate to the Project Folder
```bash
cd bq-releases-notes
```

### 2. Set up a Virtual Environment (Optional but recommended)
```bash
python -m venv venv
# Activate on Windows:
venv\Scripts\activate
# Activate on macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```
*(Or install manually: `pip install flask requests`)*

### 4. Run the Server
```bash
python app.py
```

Open your browser and visit: **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🔗 Repository
Repository hosted at: [manueldiltonfigarado-event-talks-app](https://github.com/manueldiltonfigarado/manueldiltonfigarado-event-talks-app)
