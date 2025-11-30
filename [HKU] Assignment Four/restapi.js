var express = require('express');
var app = express();





    /* Implement the logic here */

var mongoose = require('mongoose');
mongoose.connect('mongodb://mongodb/HKO')
.then(() => {
 console.log("Connected to MongoDB");
})
.catch(err => {
 console.log("MongoDB connection error: "+err);
})

var Schema = mongoose.Schema;

var weatherDatabase = new Schema({
    Date: String,
    MeanT: Number,
    MaxT: Number,
    MinT: Number,
    Humidity: Number,
    Rainfall: Number
})











// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({'error': err.message});
});

app.listen(3000, () => {
  console.log('Weather app listening on port 3000!')
});
