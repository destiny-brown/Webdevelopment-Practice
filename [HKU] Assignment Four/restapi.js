//Tested with pattern curl -v -X GET http://localhost:3000/HKO/weather/2024/12/humidity , etc
//Should work

const express = require('express');
const app = express();

const mongoose = require('mongoose');
app.use(express.json());

  /* Implement the logic here */
//Connect to Mongodb
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongodb:27017/HKO';

mongoose.set('strictQuery', true);
mongoose
  .connect(MONGO_URL, {
    dbName: 'HKO',
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message || err);
    process.exit(1);
  });

const db = mongoose.connection;

db.on('connected', () => console.log('MongoDB connected:', MONGO_URL));

db.on('error', (err) => {
  console.error('MongoDB error:', err.message || err);
});

db.on('disconnected', () => {
  console.error('Disconnected from MongoDB. Terminating the app.');
  process.exit(1); //terminate app
});

// Graceful shutdown (lol)
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

// ---------- Mongoose Schema & Model ----------
const WeatherSchema = new mongoose.Schema(
  {
    Date: String,     // DD/MM/YYYY
    MeanT: Number,    // Average temperature (°C)
    MaxT: Number,     // Max temperature (°C)
    MinT: Number,     // Min temperature (°C)
    Humidity: Number, // %
    Rainfall: Number, // mm (Trace stored as 0.01 in dataset)
  },
  { collection: 'dailydata' }
);

//create my model
const Weather = mongoose.model('Weather', WeatherSchema);

// ---------- Helpers ----------
const pad2 = (n) => String(n).padStart(2, '0');

//confirm the range of the month and year
function isValidYearMonth(y, m) {
  const year = Number(y);
  const month = Number(m);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return false;
  if (year < 1 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  return true;
}

//confirm the date type actually exists
function isValidDate(y, m, d) {
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (!isValidYearMonth(year, month)) return false;
  if (!Number.isInteger(day) || day < 1 || day > 31) return false;
  const dt = new Date(year, month - 1, day);
  return (
    dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
  );
}

function ddmmyyyyString(y, m, d) {
  return `${pad2(d)}/${pad2(m)}/${String(y).padStart(4, '0')}`;
}

function monthlyRegex(y, m) {
  // Match exactly 'DD/MM/YYYY'
  return new RegExp(`^\\d{2}/${pad2(m)}/${String(y).padStart(4, '0')}$`);
}

// this function doesn't work well...
function toTraceIfNeeded(value) {
  // For daily GET response: convert 0.01 back to 'Trace'
  return Number(value) === 0.01 ? 'Trace' : value;
}

function round2(num) {
  return Number(Number(num).toFixed(2));
}

// ---------- Routes ----------

// --- Task C: ONE route to handle all five URLs ---
// Matches:
//   /HKO/weather/YYYY/MM
//   /HKO/weather/YYYY/MM/
//   /HKO/weather/YYYY/MM/temperature
//   /HKO/weather/YYYY/MM/humidity
//   /HKO/weather/YYYY/MM/rainfall
app.get(/^\/HKO\/weather\/(\d{4})\/(\d{1,2})(?:\/(temperature|humidity|rainfall))?\/?$/, async (req, res, next) => {
  try {
    const year = Number(req.params[0]);
    const month = Number(req.params[1]);
    const metric = req.params[2]; // 'temperature' | 'humidity' | 'rainfall' | undefined

    // Validate year/month
    if (!isValidYearMonth(year, month)) {
      return res.status(400).json({ error: 'not a valid year/month' });
    }

    // Fetch all days for the month
    const docs = await Weather.find({ Date: { $regex: monthlyRegex(year, month) } }).lean();
    if (!docs || docs.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }

    const count = docs.length;

    // Precompute aggregates used by both "metric only" and "all summary"
    // Temperature
    const sumMeanT = docs.reduce((acc, r) => acc + Number(r.MeanT), 0);
    const avgTemp   = round2(sumMeanT / count);
    const maxTemp   = round2(Math.max(...docs.map(r => Number(r.MaxT))));
    const minTemp   = round2(Math.min(...docs.map(r => Number(r.MinT))));

    // Humidity
    const sumHum    = docs.reduce((acc, r) => acc + Number(r.Humidity), 0);
    const avgHum    = round2(sumHum / count);
    const maxHum    = Math.max(...docs.map(r => Number(r.Humidity)));
    const minHum    = Math.min(...docs.map(r => Number(r.Humidity)));

    // Rainfall (keep 0.01 as numeric for averages as per spec)
    const sumRain   = docs.reduce((acc, r) => acc + Number(r.Rainfall), 0);
    const avgRain   = round2(sumRain / count);
    const maxDailyRain = round2(Math.max(...docs.map(r => Number(r.Rainfall))));

    // If a specific metric was requested, return only that subset
    if (metric === 'temperature') {
      return res.status(200).json({
        Year: year,
        Month: month,
        'Avg Temp': avgTemp,
        'Max Temp': maxTemp,
        'Min Temp': minTemp,
      });
    }
    if (metric === 'humidity') {
      return res.status(200).json({
        Year: year,
        Month: month,
        'Avg Humidity': avgHum,
        'Max Humidity': maxHum,
        'Min Humidity': minHum,
      });
    }
    if (metric === 'rainfall') {
      return res.status(200).json({
        Year: year,
        Month: month,
        'Avg Rainfall': avgRain,
        'Max Daily Rainfall': maxDailyRain,
      });
    }

    // Otherwise, return the full monthly summary
    return res.status(200).json({
      Year: year,
      Month: month,
      'Avg Temp': avgTemp,
      'Max Temp': maxTemp,
      'Min Temp': minTemp,
      'Avg Humidity': avgHum,
      'Max Humidity': maxHum,
      'Min Humidity': minHum,
      'Avg Rainfall': avgRain,
      'Max Daily Rainfall': maxDailyRain,
    });
  } catch (err) {
    console.error('Task C route error:', err);
    err.status = 500;
    err.message = 'system error';
    next(err);
  }
});

// Task B: GET /HKO/weather/YYYY/MM/DD
app.get('/HKO/weather/:year/:month/:day', async (req, res, next) => {
  try {
    const { year, month, day } = req.params;
    const y = Number(year), m = Number(month), d = Number(day);

    if (!isValidDate(y, m, d)) {
      return res.status(400).json({ error: 'not a valid year/month/date' });
    }

    const dateStr = ddmmyyyyString(y, m, d);
    const doc = await Weather.findOne({ Date: dateStr }).lean();

    if (!doc) {
      return res.status(404).json({ error: 'not found' });
    }

    const weatherSummary = {
      Year: y,
      Month: m,
      Date: d,
      'Avg Temp': doc.MeanT,
      'Max Temp': doc.MaxT,
      'Min Temp': doc.MinT,
      Humidity: doc.Humidity,
      Rainfall: toTraceIfNeeded(doc.Rainfall),
    };

    return res.status(200).json(weatherSummary);
  } catch (err) {
    console.error('GET /HKO/weather/YYYY/MM/DD error:', err);
    err.status = 500;
    err.message = 'system error';
    next(err);
  }
});



// Task D: POST /HKO/weather/YYYY/MM/DD (add NEW daily record)
app.post('/HKO/weather/:year/:month/:day', async (req, res, next) => {
  try {
    const { year, month, day } = req.params;
    const y = Number(year), m = Number(month), d = Number(day);

    if (!isValidDate(y, m, d)) {
      return res.status(400).json({ error: 'not a valid year/month/date' });
    }

    const dateStr = ddmmyyyyString(y, m, d);

    // check existing
    const existed = await Weather.findOne({ Date: dateStr }).lean();
    if (existed) {
      return res.status(403).json({ error: 'find an existing record. Cannot override!!' });
    }

    // Expect JSON body: { MeanT, MaxT, MinT, Humidity, Rainfall }
    const { MeanT, MaxT, MinT, Humidity, Rainfall } = req.body || {};

    // Minimal sanity checks (the spec does not require exhaustive validation)
    const fields = [MeanT, MaxT, MinT, Humidity, Rainfall];
    if (fields.some((v) => v === undefined || v === null || Number.isNaN(Number(v)))) {
      return res.status(400).json({ error: 'invalid request body' });
    }

    const doc = new Weather({
      Date: dateStr,
      MeanT: Number(MeanT),
      MaxT: Number(MaxT),
      MinT: Number(MinT),
      Humidity: Number(Humidity),
      Rainfall: Number(Rainfall), // 0.01 may represent 'Trace' in dataset
    });

    await doc.save();
    return res.status(200).json({ okay: 'record added' });
  } catch (err) {
    console.error('POST /HKO/weather/YYYY/MM/DD error:', err);
    err.status = 500;
    err.message = 'system error';
    next(err);
  }
});

// Task E: Catch-all for undefined methods/paths
app.use((req, res) => {
  res.status(400).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// ---------- Error Handler ----------
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error: err.message || 'system error' });
});

// ---------- Start Server ----------
app.listen(3000, () => {
 console.log('Weather app listening on port 3000!')
});