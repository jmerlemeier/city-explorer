'use strict'

//require() is an import statement built into node.js - it reads complex files.
const express = require('express');
const cors = require('cors');
require('dotenv').config()

const app = express();
app.use(cors());

const PORT = process.env.PORT;

//Constructor for Location
function Location(query, format, lat, lng) {
  this.search_query = query;
  this.formatted_query = format;
  this.latitude = lat;
  this.longitude = lng;
}



// ======= TARGET LOCATION in JSON FILE =======
app.get('/location', (request, response) => {
  try {
  //Feed this all into consructor from JSON file
    const geoData = require('./data/geo.json');
    const query = request.query.data; //request.query is part of the request (NewJohn's hand) and is a vector for questions. It lives in the URL, public info. Postal service of internet.

    const specificGeoData = geoData.results[0];

    const formatted = specificGeoData.formatted_address;
    const lat = specificGeoData.geometry.location.lat;
    const lng = specificGeoData.geometry.location.lng;

    const newLocation = new Location(query, formatted, lat, lng);

    //start the response cycle
    response.send(newLocation);
  } catch(e) {
    console.error(e);
    response.status(500).send(e.message);
  }
})

// ======= TARGET WEATHER in JSON FILE =======
app.get('/weather', getWeather)

function getWeather(request, response){
  try {
    const weatherdata = require('./data/darksky.json');

    const eightDays = weatherdata.daily.data;

    const formattedDays = eightDays.map(day => new Day(day.summary, day.time)
    ); //all arrow functions implicitly return the output of the callback function.

    response.send(formattedDays)
  } catch (e) {
    console.error(e);
    response.status(500).send(e.message);
  }
}
function Day (summary, time) {
  this.forecast = summary;
  this.time = new Date(time *1000).toDateString();
}

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


//lab tomorrow
//1. Get location (just did in class) and weather and eventbite data from the internet.
//2. Trello board has everything I need for days instructions.
