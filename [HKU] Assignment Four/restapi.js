var express = require('express');
var app = express();

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
        const dateString = `${y}/${m}/${d}`;

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

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'error': err.message});
});

app.listen(3000, () => {
  console.log('Weather app listening on port 3000!')
});
