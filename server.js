'use strict'

//require() is an import statement built into node.js - it reads complex files.
const express = require('express');
require('dotenv').config()
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT;

//Global Variables
// const weatherArray = [];

//Constructor for Location
function Location(query, format, lat, lng) {
  this.search_query = query;
  this.formatted_query = format
  this.latitude = lat;
  this.longitude = lng;
}

// //Constructor for the Weather
// function Weather(summary, date){
//   this.forcast = summary;
//   this.time = date;
// }

// ======= TARGET LOCATION in JSON FILE =======
app.get('/location', (request, response) => {

  //Feed this all into consructor from JSON file
  const dataFromGoogle = require('./data/geo.json');
  const searchQuery = request.query.data; //request.query is part of the request (NewJohn's hand) and is a vector for questions. It lives in the URL, public info. Postal service of internet.

  const specificGeoData = dataFromGoogle.results[0];

  const formattedQuery = specificGeoData.formatted_address;
  const lat = specificGeoData.geometry.location.lat;
  const lng = specificGeoData.geometry.location.lng;

  const formattedData = new Location(searchQuery, formattedQuery, lat, lng);

  //start the response cycle
  response.send(formattedData);
})

// ======= TARGET WEATHER in JSON FILE =======
app.get('/weather', getWeather)

function getWeather(request, response){

  let weatherData = require('./data/darksky.json')

  const eightDays = weatherdata.daily.data;

  const formattedDays = eightDays.map(day => new Day(day.summary, day.time)); //all arrow functions implicitly return the output of the callback function.

  response.send(weatherdata)

  function Day (summary, time) {
    this.forecast = summary;
    this.time = new Date(time *1000).toDateString();
  }
}


// app.get('/weather', (req, response) => {
//   try {
//     const datafromDarkSky = require('./data/darksky.json');

//     const eightDays = datafromDarkSky.daily.data;

//     for(let i = 0; i < eightDays.length; i++){
//       let forcast = eightDays[i].summary;
//       let time = eightDays[i].time*1000;
//       var msdate = new Date(time);
//       //create object
//       const formattedData = new Weather(forcast, msdate);
//       weatherArray.push(formattedData);
//     }

//     response.send(weatherArray);

//   } catch (error) {
//     console.error(error);
//   }
// })

// ====================================

app.listen(PORT, () => {
  console.log(`app is running on ${PORT}`);
});


// class notes

// API is a server that lives on the internet. Places where code lives.
//1. Go to google api console developer website.
// 2. Copy URL in Postman and in server.js under /location
// 3. install superagent = require('cuperagent') ---> NOT EXPRESS (recieves http request, ears of operation). SUPERAGENT is the mouth, it talks to the internet over http.
// 4. rnpm install -S superagent
//5. superagent.get('url from string')
//......
//10. The dynamic part of the code is in the addess.
