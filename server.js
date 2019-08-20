'use strict'

const express = require('express');
require('dotenv').config()
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT;

//Global Variables
const weatherArray = [];


//Constructor for NEW location
function NewLocation(query, format, lat, lng) {
  this.search_Query = query;
  this.formatted_query = format
  this.latitude = lat;
  this.longitude = lng;
}

//Constructor for the NEW Weather
function NewWeather(summary, date){
  this.forcast = summary;
  this.time = date;
}

// ======= TARGET LOCATION in JSON FILE =======
app.get('/location', (req, res) => {
  try {

    const dataFromGoogle = require('./data/geo.json');
    const searchQuery = req.query.data;
    const formattedQuery = dataFromGoogle.results[0].formatted_address;
    const lat = dataFromGoogle.results[0].geometry.location.lat;
    const lng = dataFromGoogle.results[0].geometry.location.lng;

    const formattedData = new NewLocation(searchQuery, formattedQuery, lat, lng);

    res.send(formattedData);

  } catch (error) {
    console.error(error);
  }
})

// ======= TARGET WEATHER in JSON FILE =======

app.get('/weather', (req, res) => {
  try {

    const datafromDarkSky = require('./data/darksky.json');

    for(let i = 0; i < datafromDarkSky.daily.data.length; i++){
      let forcast = datafromDarkSky.daily.data[i].summary;
      let time = datafromDarkSky.daily.data[i].time*1000;
      var msdate = new Date(time);
      //create object
      const formattedData = new NewWeather(forcast, msdate);
      weatherArray.push(formattedData);
    }

    res.send(weatherArray);

  } catch (error) {
    console.error(error);
  }
})


// ======= TO DO =======
// Using each weather object of the result, return an array of objects for each day of the response which contains the necessary information for correct client rendering. See the sample response.

//

// [
//   {
//     "forecast": "Partly cloudy until afternoon.",
//     "time": "Mon Jan 01 2001"
//   },
//   {
//     "forecast": "Mostly cloudy in the morning.",
//     "time": "Tue Jan 02 2001"
//   },
//   ...
// ]

//we have an object, we need an array of objects
//so we need to take the outputs of our constructors and push them into new arrays.


// ====================================

app.listen(PORT, () => {
  console.log(`app is running on ${PORT}`);
});
