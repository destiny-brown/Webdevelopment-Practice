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

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'error': err.message});
});

app.listen(3000, () => {
  console.log('Weather app listening on port 3000!')
});
