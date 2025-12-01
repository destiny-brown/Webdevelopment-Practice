var express = require('express');
var app = express();
app.use(express.json())

    /* Implement the logic here */
//Connect to Mongodb
var mongoose = require('mongoose');
mongoose.connect('mongodb://mongodb/HKO')
.then(() => {
 console.log("Connected to MongoDB");
})
.catch(err => {
 console.log("MongoDB connection error: "+err);
})

//Connection Events, from w3schools
const db = mongoose.connection;

// Connection successful
db.once('open', () => console.log('Connected to MongoDB'));

// Connection error
db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // terminate app
});

// Connection disconnected
db.on('disconnected', () => {
    console.error('Disconnected from MongoDB. Terminating the app.');
    process.exit(1); // terminate app
});


//set the schema
var Schema = mongoose.Schema;

var weatherDatabase = new Schema({
    Date: String,
    MeanT: Number,
    MaxT: Number,
    MinT: Number,
    Humidity: Number,
    Rainfall: Number
})

//Create my model
var myWeather = mongoose.model("dailydata", weatherDatabase);


// helpers for HKO date format (DD/MM/YYYY)
function pad2(n){ return n.toString().padStart(2,'0'); }
function toHkoDateString(y,m,d){ return `${pad2(d)}/${pad2(m)}/${y}`; }


//Task B

app.get('/HKO/weather/:year/:month/:day', async (req, res) => {
    const { year, month, day } = req.params;

    // Convert to integers
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    // Validate numeric ranges
    if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1000 || m < 1 || m > 12 || d < 1 || d > 31) {
        return res.status(400).json({ error: "not a valid year/month/date" });
    }

    // Validate actual date (e.g., no Feb 30)
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
        return res.status(400).json({ error: "not a valid year/month/date" });
    }

    try {
        // Normalize date format as stored in DB (e.g., "YYYY/MM/DD")
        const dateString = toHkoDateString(y, m, d)

        const weatherData = await myWeather.findOne({ Date: dateString });

        if (!weatherData) {
            return res.status(404).json({ error: "not found" });
        }

        
 const rainfallValue = weatherData.Rainfall === 0.01 ? "Trace" : weatherData.Rainfall;

        const responseData = {
            "Year": y,
            "Month": m,
            "Date": d,
            "Avg Temp": weatherData.MeanT,
            "Max Temp": weatherData.MaxT,
            "Min Temp": weatherData.MinT,
            "Humidity": weatherData.Humidity,
            "Rainfall": rainfallValue
        };

        return res.status(200).json(responseData);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "system error" });
    }
});

//Task C

function validateYM(y,m){ return !(isNaN(y)||isNaN(m)||y<1000||m<1||m>12); }
async function getMonthRecords(y,m){
  const monthRegex = new RegExp(`^\\d{2}/${pad2(m)}/${y}$`); // records like DD/MM/YYYY
  return myWeather.find({ Date: { $regex: monthRegex } });
}
function summarize(records){
  let sumMeanT=0, maxT=-Infinity, minT=Infinity;
  let sumHumidity=0, maxHumidity=-Infinity, minHumidity=Infinity;
  let sumRainfall=0, maxRainfall=-Infinity;
  records.forEach(r=>{
    sumMeanT += r.MeanT; maxT = Math.max(maxT, r.MaxT); minT = Math.min(minT, r.MinT);
    sumHumidity += r.Humidity; maxHumidity = Math.max(maxHumidity, r.Humidity); minHumidity = Math.min(minHumidity, r.Humidity);
    const rainfallVal = r.Rainfall === 0.01 ? 0.01 : r.Rainfall; // keep trace as 0.01 for averaging
    sumRainfall += rainfallVal; maxRainfall = Math.max(maxRainfall, rainfallVal);
  });
  const count = records.length;
  return {
    avgTemp: +(sumMeanT / count).toFixed(2),
    maxT, minT,
    avgHumidity: +(sumHumidity / count).toFixed(2),
    maxHumidity, minHumidity,
    avgRainfall: +(sumRainfall / count).toFixed(2),
    maxDailyRainfall: maxRainfall
  };
}

app.get('/HKO/weather/:year/:month/temperature', async (req,res)=>{
  const y = +req.params.year, m = +req.params.month;
  if(!validateYM(y,m)) return res.status(400).json({error:"not a valid year/month"});
  try{
    const records = await getMonthRecords(y,m);
    if(!records || records.length===0) return res.status(404).json({error:"not found"});
    const s = summarize(records);
    return res.status(200).json({ Year:y, Month:m, "Avg Temp": s.avgTemp, "Max Temp": s.maxT, "Min Temp": s.minT });
  }catch(err){ console.error(err); return res.status(500).json({error:"system error"}); }
});

app.get('/HKO/weather/:year/:month/humidity', async (req,res)=>{
  const y = +req.params.year, m = +req.params.month;
  if(!validateYM(y,m)) return res.status(400).json({error:"not a valid year/month"});
  try{
    const records = await getMonthRecords(y,m);
    if(!records || records.length===0) return res.status(404).json({error:"not found"});
    const s = summarize(records);
    return res.status(200).json({ Year:y, Month:m, "Avg Humidity": s.avgHumidity, "Max Humidity": s.maxHumidity, "Min Humidity": s.minHumidity });
  }catch(err){ console.error(err); return res.status(500).json({error:"system error"}); }
});

app.get('/HKO/weather/:year/:month/rainfall', async (req,res)=>{
  const y = +req.params.year, m = +req.params.month;
  if(!validateYM(y,m)) return res.status(400).json({error:"not a valid year/month"});
  try{
    const records = await getMonthRecords(y,m);
    if(!records || records.length===0) return res.status(404).json({error:"not found"});
    const s = summarize(records);
    return res.status(200).json({ Year:y, Month:m, "Avg Rainfall": s.avgRainfall, "Max Daily Rainfall": s.maxDailyRainfall });
  }catch(err){ console.error(err); return res.status(500).json({error:"system error"}); }
});

app.get(['/HKO/weather/:year/:month', '/HKO/weather/:year/:month/'], async (req,res)=>{
  const y = +req.params.year, m = +req.params.month;
  if(!validateYM(y,m)) return res.status(400).json({error:"not a valid year/month"});
  try{
    const records = await getMonthRecords(y,m);
    if(!records || records.length===0) return res.status(404).json({error:"not found"});
    const s = summarize(records);
    return res.status(200).json({
      Year:y, Month:m,
      "Avg Temp": s.avgTemp, "Max Temp": s.maxT, "Min Temp": s.minT,
      "Avg Humidity": s.avgHumidity, "Max Humidity": s.maxHumidity, "Min Humidity": s.minHumidity,
      "Avg Rainfall": s.avgRainfall, "Max Daily Rainfall": s.maxDailyRainfall
    });
  }catch(err){ console.error(err); return res.status(500).json({error:"system error"}); }
});


//Task D
app.post(['/HKO/weather/:year/:month/:day' ], async (req, res) => {
    const { year, month, day } = req.params;

    // Convert to integers
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    // Validate numeric ranges
    if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1000 || m < 1 || m > 12 || d < 1 || d > 31) {
        return res.status(400).json({ error: "not a valid year/month/date" });
    }

    // Validate actual date (e.g., no Feb 30)
    const dateObj = new Date(y, m - 1, d);
    if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
        return res.status(400).json({ error: "not a valid year/month/date" });
    }

    try {
        // Normalize date format as stored in DB (e.g., "YYYY/MM/DD")
        const dateString = toHkoDateString(y, m, d);

        const recordExists = await myWeather.findOne({ Date: dateString });

        if (recordExists) {
            return res.status(403).json({ error: "find an existing record.Cannot override!!" });
        }

        
// Create new record from request body
        const { MeanT, MaxT, MinT, Humidity, Rainfall } = req.body;

// Validate required fields
        if (MeanT === undefined || MaxT === undefined || MinT === undefined || Humidity === undefined || Rainfall === undefined) {
            return res.status(400).json({ error: "missing required weather data fields" });
        }

        const newRecord = new myWeather({
            Date: dateString,
            MeanT,
            MaxT,
            MinT,
            Humidity,
            Rainfall
        });

        await newRecord.save();
        return res.status(200).json({ okay: "record added" });
    }catch (err) {
        console.error(err);
        return res.status(500).json({ error: "system error" });
    }

    });

//Task E
app.use((req, res) => {
  res.status(400).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});



// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'error': err.message});
});

app.listen(3000, () => {
  console.log('Weather app listening on port 3000!')
});
