/**
 * HKAA Flight Report Front-End
 * - Validates date range: Today - 91 to Yesterday (inclusive) in HK time.
 * - Custom alert messages above the form (not native browser messages).
 * - Fetches departure/arrival via flight.php (HKAA proxy) with EXACT 4 query strings.
 * - Filters dataset to ONLY the requested date (HKAA may return multiple dates).
 * - Uses only 'status' and destination[0]/origin[0] per assignment spec.
 * - Computes totals, unique IATAs, special cases, histograms (with prev/next bins),
 *   and Top 10 airports using iata.json (array with { iata_code, name, municipality }).
 */

//To get today's date using hk time
function todayHK() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()); // local midnight
}

//Convert javascript date to string format for easier processing
function dateToString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
}
function parseDMY(dmy) {
    const [dd, mm, yyyy] = dmy.split("/").map((s) => parseInt(s, 10));
    return new Date(yyyy, mm - 1, dd);
}

// ---------- DOM references ----------
const form = document.getElementById("dateForm");
const dateInput = document.getElementById("flightDate");
const alertBox = document.getElementById("alertMessage");

const resultsSection = document.getElementById("results");
const reportHeader = document.getElementById("reportHeader");

const departureSummaryList = document.getElementById("departureSummaryList");
const arrivalSummaryList = document.getElementById("arrivalSummaryList");

const specialDepartures = document.getElementById("specialDepartures");
const specialArrivals = document.getElementById("specialArrivals");

const depHistogram = document.getElementById("depHistogram");
const arrHistogram = document.getElementById("arrHistogram");

const topDestinations = document.getElementById("topDestinations");
const topOrigins = document.getElementById("topOrigins");


// date constraints
(function initDateConstraints() {
    const today = todayHK();
    const yesterday = addDays(today, -1);
    const minDate = addDays(today, -91);

    dateInput.min = dateToString(minDate);
    dateInput.max = dateToString(yesterday);
    dateInput.placeholder = `${dateToString(minDate)} to ${dateToString(yesterday)}`;
})();

// ---------- Load iata.json and build an index (array format) ----------
let iataIndex = null;
/**
 * Builds an index: IATA code (uppercase) -> { name, municipality }
 * Expects iata.json to be an array of objects with fields:
 *   - iata_code (string)
 *   - name (string)
 *   - municipality (string)
 */
async function loadIataIndex() {
    if (iataIndex) return iataIndex;

    const resp = await fetch("iata.json");
    if (!resp.ok) throw new Error("Failed to load iata.json");

    const data = await resp.json();
    const index = {};

    if (Array.isArray(data)) {
        for (const item of data) {
            const code = String(item.iata_code || item.iata || item.code || "").trim().toUpperCase();
            if (!code) continue;
            index[code] = {
                name: item.name || "Unknown airport",
                municipality: item.municipality || "Unknown city",
            };
        }
    } else {
        for (const [k, v] of Object.entries(data || {})) {
            const code = k.toUpperCase();
            index[code] = {
                name: v?.name || "Unknown airport",
                municipality: v?.municipality || "Unknown city",
            };
        }
    }

    iataIndex = index;
    return iataIndex;
}

// ---------- Field extractors (per assignment) ----------
function getStatus(f) {
    return String(f?.status || "").trim();
}
/** Departures: destination[0] */
function getDestIATA(f) {
    const arr = f?.destination;
    if (!Array.isArray(arr) || arr.length === 0) return "";
    const first = arr[0];
    if (typeof first === "string") return first.trim().toUpperCase();
    if (first && typeof first === "object") {
        return String(first.iata_code || first.iata || first.code || "").trim().toUpperCase();
    }
    return "";
}
/** Arrivals: origin[0] */
function getOrigIATA(f) {
    const arr = f?.origin;
    if (!Array.isArray(arr) || arr.length === 0) return "";
    const first = arr[0];
    if (typeof first === "string") return first.trim().toUpperCase();
    if (first && typeof first === "object") {
        return String(first.iata_code || first.iata || first.code || "").trim().toUpperCase();
    }
    return "";
}

// ---------- Status parsing & classification ----------
const RE_DEP = /^Dep\s(\d{2}):(\d{2})(?:\s\((\d{2})\/(\d{2})\/(\d{4})\))?$/;
const RE_ARR = /^At gate\s(\d{2}):(\d{2})(?:\s\((\d{2})\/(\d{2})\/(\d{4})\))?$/;

/**
 * Parse status. If matches allowed formats:
 *   dep: "Dep hh:mm" or "Dep hh:mm (dd/MM/yyyy)" → ok=true
 *   arr: "At gate hh:mm" or "At gate hh:mm (dd/MM/yyyy)" → ok=true
 * Returns { ok, hour?, tag? }, where tag in dep: "normal"|"next"; arr: "normal"|"prev"|"next"
 */
function parseStatus(status, kind, flightDate) {
    const s = (status || "").trim();
    const m = (kind === "dep" ? RE_DEP : RE_ARR).exec(s);
    if (!m) return { ok: false };

    const hh = parseInt(m[1], 10);
    let tag = "normal";

    if (m[3] && m[4] && m[5]) {
        const dmy = new Date(parseInt(m[5], 10), parseInt(m[4], 10) - 1, parseInt(m[3], 10));
        const deltaDays = Math.round((dmy - flightDate) / (24 * 3600 * 1000));
        if (kind === "dep") {
            if (deltaDays === 1) tag = "next";
        } else {
            if (deltaDays === -1) tag = "prev";
            else if (deltaDays === 1) tag = "next";
        }
    }
    return { ok: true, hour: hh, tag };
}

// ---------- Histogram builders ----------
function initDepBins() {
    const bins = {};
    for (let h = 0; h < 24; h++) bins[String(h).padStart(2, "0")] = 0;
    bins["next"] = 0;
    return bins;
}
function initArrBins() {
    const bins = {};
    for (let h = 0; h < 24; h++) bins[String(h).padStart(2, "0")] = 0;
    bins["prev"] = 0;
    bins["next"] = 0;
    return bins;
}
function buildDepartureHistogram(flights, flightDate) {
    const bins = initDepBins();
    for (const f of flights) {
        const st = parseStatus(getStatus(f), "dep", flightDate);
        if (!st.ok) continue;
        if (st.tag === "next") bins["next"]++;
        else bins[String(st.hour).padStart(2, "0")]++;
    }
    return bins;
}
function buildArrivalHistogram(flights, flightDate) {
    const bins = initArrBins();
    for (const f of flights) {
        const st = parseStatus(getStatus(f), "arr", flightDate);
        if (!st.ok) continue;
        if (st.tag === "prev" || st.tag === "next") bins[st.tag]++;
        else bins[String(st.hour).padStart(2, "0")]++;
    }
    return bins;
}

// ---------- Special cases frequency ----------
function countSpecialCases(flights, kind, flightDate) {
    const freq = new Map();
    for (const f of flights) {
        const stRaw = getStatus(f);
        const st = parseStatus(stRaw, kind, flightDate);
        if (st.ok) continue;
        const key = stRaw || "(empty)";
        freq.set(key, (freq.get(key) || 0) + 1);
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// ---------- Unique IATA counts ----------
function uniqueIATACount(flights, extractor) {
    const set = new Set();
    for (const f of flights) {
        const code = extractor(f);
        if (code) set.add(code);
    }
    return set.size;
}

// ---------- Top 10 by IATA ----------
function top10ByIATA(flights, extractor) {
    const counts = new Map();
    for (const f of flights) {
        const code = extractor(f);
        if (!code) continue;
        counts.set(code, (counts.get(code) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
}


// ---------- Rendering helpers ----------
function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
}

// Render the departure-only summary (no special cases here)
function renderDepartureSummary(
    listNode,
    { dateISO, depCount, depUnique, depSpecialCases } // <-- add depSpecialCases
) {
    clearNode(listNode);

    // Format special cases into a readable string
    const specialCasesText = (() => {
        if (!depSpecialCases || depSpecialCases.length === 0) return "None";
        return depSpecialCases.map(([label, count]) => `${label} (${count})`).join(", ");
    })();

    const items = [
        `Dataset date: ${dateISO}`,
        `Total flights: ${depCount}`,
        `Destinations: ${depUnique}`,
        `Special cases: ${specialCasesText}`, // <-- inline summary
    ];

    for (const t of items) {
        const li = document.createElement("li");
        li.textContent = t;
        listNode.appendChild(li);
    }
}

// Render the arrival-only summary
function renderArrivalSummary(
    listNode,
    { dateISO, arrCount, arrUnique, arrSpecialCases } // <-- add arrSpecialCases
) {
    clearNode(listNode);

    // Turn entries like [['Delayed', 7], ['Cancelled', 2]] into:
    // "Delayed (7), Cancelled (2)" — or "None" if empty
    const specialCasesText = (() => {
        if (!arrSpecialCases || arrSpecialCases.length === 0) return "None";
        return arrSpecialCases.map(([label, count]) => `${label}: ${count}`).join("; ");
    })();

    const items = [
        `Dataset date: ${dateISO}`,
        `Total flights: ${arrCount}`,
        `Origins: ${arrUnique}`,
        `Special cases: ${specialCasesText}`, // <-- as requested
    ];

    for (const t of items) {
        const li = document.createElement("li");
        li.textContent = t;
        listNode.appendChild(li);
    }
}

// Render special cases (generic)
function renderSpecialCases(listNode, entries) {
    clearNode(listNode);
    if (!entries || entries.length === 0) {
        const li = document.createElement("li");
        li.textContent = "None";
        listNode.appendChild(li);
        return;
    }
    for (const [label, count] of entries) {
        const li = document.createElement("li");
        li.textContent = `${label}: ${count}`;
        listNode.appendChild(li);
    }
}

// Render histogram (generic)
function renderHistogram(container, bins, labelOrder) {
    clearNode(container);
    const max = Math.max(...labelOrder.map((k) => bins[k] || 0), 1);
    for (const key of labelOrder) {
        const count = bins[key] || 0;

        const label = document.createElement("div");
        label.className = "hist-label";
        label.textContent = key;

        const wrap = document.createElement("div");
        wrap.className = "hist-bar-wrap";

        const bar = document.createElement("div");
        bar.className = "hist-bar";
        bar.style.width = `${Math.round((count / max) * 100)}%`;

        const num = document.createElement("div");
        num.className = "hist-count";
        num.textContent = String(count);

        container.appendChild(label);
        wrap.appendChild(bar);
        wrap.appendChild(num);
        container.appendChild(wrap);
    }
}

function renderTop10(listNode, entries, iataIndex) {
    clearNode(listNode);
    if (entries.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No data";
        listNode.appendChild(li);
        return;
    }
    for (const [code, count] of entries) {
        const meta = iataIndex?.[code] || null;
        const name = meta?.name || "Unknown airport";
        const city = meta?.municipality || "Unknown city";
        const li = document.createElement("li");
        li.textContent = `${code} — ${name}, ${city} (${count})`;
        listNode.appendChild(li);
    }
}

// ---------- Alerts ----------
function showAlert(msg) { alertBox.textContent = msg; }
function clearAlert() { alertBox.textContent = ""; }

// ---------- Response normalization: keep ONLY the requested date ----------
/**
 * HKAA responses can include multiple dates; we extract flights for dateISO only.
 * Typical HKAA "past" response shape (proxied by flight.php):
 *    [ { "date": "YYYY-MM-DD", "list": [ { status, destination, origin, ... }, ... ] }, ... ]
 * We select the schedule whose "date" === dateISO and return its "list".
 */
function extractFlightsForDate(resp, dateISO) {
    if (!resp) return [];

    // Array of schedule objects
    if (Array.isArray(resp)) {
        const sched = resp.find(s => s && typeof s === "object" && s.date === dateISO && Array.isArray(s.list));
        return Array.isArray(sched?.list) ? sched.list : [];
    }

    // Single schedule object
    if (resp && typeof resp === "object" && resp.date && Array.isArray(resp.list)) {
        return resp.date === dateISO ? resp.list : [];
    }

    // Fallback: try nested arrays
    for (const v of Object.values(resp || {})) {
        if (Array.isArray(v)) {
            const sched = v.find(s => s && s.date === dateISO && Array.isArray(s.list));
            if (sched) return sched.list;
        }
    }

    return [];
}

// ---------- FETCH via flight.php (UPDATED to send EXACT 4 query params) ----------
async function fetchFlights(dateISO) {
    // IMPORTANT: flight.php enforces exactly 4 query params: date, lang, cargo, arrival
    const paramsBase = `date=${encodeURIComponent(dateISO)}&lang=en&cargo=false`;

    const [depResp, arrResp] = await Promise.all([
        fetch(`flight.php?${paramsBase}&arrival=false`),
        fetch(`flight.php?${paramsBase}&arrival=true`),
    ]);

    // Handle non-OK: try to parse error JSON and show alert
    if (!depResp.ok || !arrResp.ok) {
        let message = "Failed to fetch departure/arrival datasets.";
        try {
            const errJson = !depResp.ok ? await depResp.json() : await arrResp.json();
            if (errJson?.message) message = errJson.message;
        } catch (_) {
            // ignore parse errors; keep generic message
        }
        throw new Error(message);
    }

    const depRaw = await depResp.json();
    const arrRaw = await arrResp.json();

    const departure = extractFlightsForDate(depRaw, dateISO);
    const arrival = extractFlightsForDate(arrRaw, dateISO);

    return {
        departure: Array.isArray(departure) ? departure : [],
        arrival: Array.isArray(arrival) ? arrival : [],
    };
}

// ---------- Form submit handler (UPDATED error display) ----------
form.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const val = (dateInput.value || "").trim();
    const min = dateInput.min;
    const max = dateInput.max;

    // Custom validations:
    if (!val) {
        showAlert("Please select a date before searching.");
        dateInput.setCustomValidity("A date is required.");
        dateInput.reportValidity(); // optional
        return;
    }
    // Enforce YYYY-MM-DD format (input[type="date"] ensures this, but we double-check)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        showAlert("Invalid date format. Please use YYYY-MM-DD.");
        dateInput.setCustomValidity("Date must be in YYYY-MM-DD format.");
        dateInput.reportValidity();
        return;
    }
    if (val < min || val > max) {
        showAlert(`Invalid date. Please select a date between ${min} and ${max} (inclusive).`);
        dateInput.setCustomValidity(`Date must be between ${min} and ${max}.`);
        dateInput.reportValidity(); // optional
        return;
    }

    // Valid: reset alert and browser validity, and proceed
    clearAlert();
    dateInput.setCustomValidity("");
    const dateISO = val;

    try {
        const iataIdx = await loadIataIndex();
        const { departure, arrival } = await fetchFlights(dateISO);

        const [y, m, d] = dateISO.split("-").map(Number);
        const flightDate = new Date(y, m - 1, d);

        resultsSection.classList.remove("hidden");
        reportHeader.textContent = `Flight Statistics on ${dateISO}`;

        // --- Counts & uniques ---
        const depCount = departure.length;
        const arrCount = arrival.length;

        const depUnique = uniqueIATACount(departure, getDestIATA);
        const arrUnique = uniqueIATACount(arrival, getOrigIATA);

        // --- Split summaries (now include special cases inline) ---
        const depSpecial = countSpecialCases(departure, "dep", flightDate);
        const arrSpecial = countSpecialCases(arrival, "arr", flightDate);

        renderDepartureSummary(departureSummaryList, {
            dateISO,
            depCount,
            depUnique,
            depSpecialCases: depSpecial,   // <-- added
        });

        renderArrivalSummary(arrivalSummaryList, {
            dateISO,
            arrCount,
            arrUnique,
            arrSpecialCases: arrSpecial,   // <-- added
        });


        // --- Histograms ---
        const depBins = buildDepartureHistogram(departure, flightDate);
        const arrBins = buildArrivalHistogram(arrival, flightDate);

        const depOrder = [
            ..."0123456789".split("").map((x) => `0${x}`),
            ..."1011121314151617181920212223".match(/../g),
            "next",
        ];
        const arrOrder = [
            ..."0123456789".split("").map((x) => `0${x}`),
            ..."1011121314151617181920212223".match(/../g),
            "prev",
            "next",
        ];

        renderHistogram(depHistogram, depBins, depOrder);
        renderHistogram(arrHistogram, arrBins, arrOrder);

        // --- Top 10 ---
        const topDest = top10ByIATA(departure, getDestIATA);
        const topOrig = top10ByIATA(arrival, getOrigIATA);

        renderTop10(topDestinations, topDest, iataIdx);
        renderTop10(topOrigins, topOrig, iataIdx);

        // Clear the date input field (per spec)
        dateInput.value = "";
    } catch (err) {
        console.error(err);
        showAlert(err?.message || "Failed to load data. Please try again later.");
    }
});
``