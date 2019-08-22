'use strict'

//require() is an import statement built into node.js - it reads complex files.
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
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

// =========== TARGET LOCATION from API ===========

app.get('/location', (request, response) => {
  const query = request.query.data; //request.query is part of the request (NewJohn's hand) and is a vector for questions. It lives in the URL, public info. Postal service of internet. John take the question (lat, lng) because he wants data at a specific lat/lng.

  const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API}`;

  superagent.get(urlToVisit).then(responseFromSuper => {
    console.log('stuff', responseFromSuper.body);


    const geoData = responseFromSuper.body;

    const specificGeoData = geoData.results[0];

    const formatted = specificGeoData.formatted_address;
    const lat = specificGeoData.geometry.location.lat;
    const lng = specificGeoData.geometry.location.lng;

    const newLocation = new Location(query, formatted, lat, lng);
    //start the response cycle
    response.send(newLocation);
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  })
})

// =========== TARGET WEATHER from API ===========

app.get('/weather', getWeather)

function getWeather(request, response){
  // console.log(request);

  const localData = request.query.data;

  const urlDarkSky = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${localData.latitude},${localData.longitude}`;

  superagent.get(urlDarkSky).then(responseFromSuper => {

    const weatherData = responseFromSuper.body;
    // console.log('weather', weatherData);

    const eightDays = weatherData.daily.data;

    const formattedDays = eightDays.map(day => new Day(day.summary, day.time)
    );
    response.send(formattedDays)
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  })
  function Day (summary, time) {
    this.forecast = summary;
    this.time = new Date(time *1000).toDateString();
  }
}

// ============ EVENTBRITE from API ==============

app.get('/events', getEvents)

function getEvents(request, response){

  let eventData = request.query.data;

  const urlfromEventbrite = `https://www.eventbriteapi.com/v3/events/search/?sort_by=date&location.latitude=${eventData.latitude}&location.longitude=${eventData.longitude}&token=${process.env.EVENTBRITE_API_KEY}`;

  superagent.get(urlfromEventbrite).then(responseFromSuper => {
    console.log(responseFromSuper.body)

    const eventbriteData = responseFromSuper.body.events;

    const formattedEvents = eventbriteData.map(event => new Event(event.url, event.name.text, event.start.local, event.description.text));

    response.send(formattedEvents);
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  })
  function Event (link, name, event_date, summary){
    this.link = link;
    this.name = name;
    this.event_date = new Date(event_date).toDateString();
    this.summary = summary;
  }
}

// ====================================

app.listen(PORT, () => {
  console.log(`app is running on ${PORT}`);
});


// class notes

// API is a server that lives on the internet. Places where code lives.
//1. Go to google api console developer website.
// 2. Copy URL in Postman and in server.js under /location
// 3. install superagent = require('superagent') ---> NOT EXPRESS (recieves http request, ears of operation). SUPERAGENT is the mouth, it talks to the internet over http.
// 4. rnpm install -S superagent
//5. superagent.get('url from string')
//......
//10. The dynamic part of the code is in the addess.


//lab tomorrow
//1. Get location (just did in class) and weather and eventbite data from the internet.
//2. Trello board has everything I need for days instructions.



//Aug 21, 2019
//FRONT END - with jQuery and AJAX
//result comes from server
//need link, name, event_date, summary.
//look in POSTMAN. Looks like it lives at obj.name.text;

//SQL Databases
//How to interact with it from a dev standpoint.
//CASE IS NOT READ HERE. CAMEL CASE DOES NOT work well.

//PostgreSQL Shell https://github.com/codefellows/seattle-301d50/blob/master/class-08/cheatsheets/postgres-shell.md

//Database is big picture - like an excel spreadsheet
//         /dt ---> lists data tables.
//----------------------
//sjschmidt=# \dt

// List of relations
// Schema |   Name   | Type  |   Owner
// --------+----------+-------+-----------
// public | articles | table | sjschmidt
// public | authors  | table | sjschmidt
// (4 rows)

//SELECT * FROM locations;
//hit enter, this give the table layout of what you just asked for.

//CREATE A TABLE
//city-explorer=# CREATE TABLE test (
//city-explorer(# id SERIAL PRIMARY KEY,
//city-explorer(# name TEXT,
//city-explorer(# coolness INT,
//city-explorer(# nickname VARCHAR(255)
//city-explorer(# );

//VARCHAR(255)   255 is max length of string

//I WANT STUFF IN MY TABLE
//city-explorer=# INSERT INTO test (name, coolness, nickname) VALUES ('julie', 9, 'jules');

//(name, coolness, nickname) <----these are all the column headers in table.

//What is in my table?
//What is my command to select everything in my table?
//city-explorer=# SELECT * FROM test;

//We will build a schema.sql in VS CODE
//1. name a file schedma.sql
//2. Wipe out the old data
//3. DROP TABLE IF EXISTS locations; <-----name of the table
//4. CREATE TABLE locations (
//id SERIAL PRIMARY KEY,
//search_query VARCHAR(255),
//formatted_query VARCHAR(255),
//latitude NUMERIC(10,7),
//longitude NUMERIC(10,7),
//);

// The next 4 lines are NOT MSMediaKeyNeededEvent, ONLY FOR TESTING!!!!!
// INSERT INTO locations
// (search_query, formatted_query, latitude, longitude)
// VALUES
// ('las vegas' 'Las VEGASSSSSS', 33.3333333, 122.2222222);


// \q   <-----quits

//psql -f schema.sql -d city-explorer

//for lab
//build schema.sql file for each of the things getting data for: events, yelp, ect.
//4 drop table statments and 4 create tables.

// server.js
//build the usual server stuff
//express lets me listen
//superagent allows us to get info from the internet
//postgresQL  --->   npm install -S pg ------> this lets us talk to postgres
//we need a connection string 
//postgres lives at a different PORT than server

//DATABASE_URL=postgres://jmerlemeier:passwords  <-----goes in .env

//now check to see if 