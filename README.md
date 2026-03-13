# Web Development Practice

A collection of web development learning projects, tutorials, and university assignments covering front-end and full-stack development.

> **⚠️ Disclaimer:** This repository contains personal and private work created solely by me (destiny-brown). All content, code, and materials in this repository are my own intellectual property. **Do not copy, reproduce, or distribute any part of this work without explicit permission.**

## Table of Contents

- [Overview](#overview)
- [Projects](#projects)
  - [Bro Code JS Tutorial](#bro-code-js-tutorial)
  - [CS50 Web](#cs50-web)
  - [3322 Notes](#3322-notes)
  - [HKU Assignment One](#hku-assignment-one)
  - [HKU Assignment Two – Flight Report System](#hku-assignment-two--flight-report-system)
  - [HKU Assignment Three – Financial Dashboard](#hku-assignment-three--financial-dashboard)
  - [HKU Assignment Four – Weather REST API](#hku-assignment-four--weather-rest-api)
  - [Date Range Picker](#date-range-picker)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)

---

## Overview

This repository documents a progression through web development concepts — from JavaScript fundamentals to full-stack applications using PHP, Node.js, MySQL, and MongoDB. It includes course notes, tutorial exercises, and formal university assignments.

---

## Projects

### Bro Code JS Tutorial

**Location:** `Bro Code JS Tutorial/`

Practice exercises based on the Bro Code JavaScript tutorial series, covering core JS concepts:

| Folder | Topic |
|--------|-------|
| `Checked Property/` | Checkbox form element handling |
| `Counter Program/` | Interactive counter with increment/decrement buttons |
| `If Statements/` | Conditional logic (if/else) |
| `Loops/` | Loop constructs and iteration |
| `Random Number Generator/` | Generating and displaying random numbers |
| `String Methods/` | String manipulation methods |
| `Switch/` | Switch statement examples |
| `Ternary Operator/` | Shorthand conditional expressions |
| `Practice/` | Additional HTML practice |

**Stack:** HTML, CSS, Vanilla JavaScript

---

### CS50 Web

**Location:** `CS50 Web/`

Practice files from Harvard's CS50 Web Programming course.

- `practice.html` – Basic HTML structure (headings, buttons, lists)
- `practice.js` – JavaScript functions (`hello()`, `count()`)
- `practice.css` – Styling
- `practice.scss` – SCSS stylesheet

**Stack:** HTML, CSS, SCSS, JavaScript

---

### 3322 Notes

**Location:** `3322 Notes/`

Course notes demonstrating HTML5 features:

- `html5.html` – Geolocation API usage, Canvas drawing with `textAlign`

**Stack:** HTML5, JavaScript

---

### HKU Assignment One

**Location:** `[HKU] Assignment One/`

An HTML & CSS assignment consisting of two independent tasks.

- **Task A:** `index_taskA.html` + `index_taskA.css`
- **Task B:** `index_taskB.html` + `index_taskB.css`
- Includes four image assets (`img1.jpg` – `img4.jpg`)

**Stack:** HTML5, CSS

---

### HKU Assignment Two – Flight Report System

**Location:** `[HKU] Assignment Two/`

A web application that fetches and displays arrival/departure flight data from the Hong Kong Airport Authority (HKAA) API.

**Features:**
- Date range selection with validation (last 91 days, Hong Kong timezone)
- Flight statistics: totals, unique IATAs, histogram, Top 10 airports
- PHP backend proxy that validates query parameters and handles CORS
- IATA airport code lookup via bundled `iata.json` dataset

**Files:**
| File | Purpose |
|------|---------|
| `index.html` | Frontend UI |
| `flight.js` | Frontend logic (fetch, stats, display) |
| `flight.php` | Backend proxy to HKAA API |
| `flight.css` | Styles |
| `iata.json` | Airport code → name mapping |

**Stack:** HTML, CSS, JavaScript, PHP

---

### HKU Assignment Three – Financial Dashboard

**Location:** `[HKU] Assignment Three/`

A customisable financial dashboard with drag-and-drop block reordering and visibility toggles, backed by a MySQL database.

**Features:**
- 8 financial data blocks (Forex, Hang Seng Index, NASDAQ, S&P 500, Cryptocurrency, Gold, Financial Calculator, Stock Volatility)
- Customisation mode: show/hide blocks via eye icons, reorder via drag-and-drop
- Persistent state stored in MySQL via PHP
- Session management with cookies

**Files:**
| File/Folder | Purpose |
|-------------|---------|
| `index.php` | Backend (MySQL integration, block state management) |
| `index.js` | Frontend (drag-and-drop, visibility toggle, DOM helpers) |
| `index.css` | Dashboard styles |
| `images/` | Block icons and eye toggle icons (PNG) |

**Stack:** HTML, CSS, JavaScript, PHP, MySQL

---

### HKU Assignment Four – Weather REST API

**Location:** `[HKU] Assignment Four/`

A RESTful API server for weather data built with Node.js and Express, backed by MongoDB.

**Features:**
- Express server with Mongoose ODM
- Weather data schema: `Date`, `MeanT`, `MaxT`, `MinT`, `Humidity`
- Connects to MongoDB at `mongodb://mongodb:27017/HKO` (where `mongodb` is the Docker service name — update to `localhost` or your host if running outside Docker)
- Graceful shutdown handling (`SIGINT`)

**Files:**
| File | Purpose |
|------|---------|
| `restapi.js` | Express/Mongoose server |

**Stack:** Node.js, Express, MongoDB, Mongoose

---

### Date Range Picker

**Location:** `date_range_picker.html`

A standalone HTML page demonstrating a linked date range picker with smart validation:

- Start date minimum is enforced relative to the selected end date, and vice versa
- Submit button displays the selected date range

**Stack:** HTML, JavaScript

---

## Technologies Used

| Technology | Usage |
|-----------|-------|
| HTML5 | Markup for all projects |
| CSS / SCSS | Styling and layout |
| JavaScript (Vanilla) | Frontend interactivity |
| PHP | Server-side backend (Assignments 2 & 3) |
| Node.js / Express | REST API (Assignment 4) |
| MongoDB / Mongoose | NoSQL database (Assignment 4) |
| MySQL | Relational database (Assignment 3) |

---

## Getting Started

### Prerequisites

- A modern web browser
- [Node.js](https://nodejs.org/) (for Assignment Four)
- A PHP-capable web server (e.g. XAMPP, MAMP) and MySQL (for Assignments Two & Three)
- MongoDB (for Assignment Four)

### Running Tutorial / Static Projects

Open any `.html` file directly in your browser (no build step required).

### Running the Weather REST API (Assignment Four)

```bash
npm install
node "[HKU] Assignment Four/restapi.js"
```

Ensure MongoDB is running and accessible at `mongodb://mongodb:27017/HKO` before starting the server.

### Running the Financial Dashboard (Assignment Three)

Deploy the `[HKU] Assignment Three/` folder to a PHP/MySQL-capable server. Open `index.php` and update the `mysqli_connect()` call near the top of the file with your database host, username, password, and database name before first use.
