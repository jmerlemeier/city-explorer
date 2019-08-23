'use strict'

//REQUIRED
//require() is an import statement built into node.js - it reads complex files.
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');
require('dotenv').config()
const app = express();
app.use(cors());


//GLOBAL VARS
const PORT = process.env.PORT || 8888;

const msInSec = 1000;
const secInHour = 3600;
const secInDay = 3600 * 24;

//CONNECT TO DATABASE
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', (error) => console.error(error));

//CONSTRUCTOR FUNCTIONS
//Constructor for Location
function Location(query, format, lat, lng) {
  this.search_query = query;
  this.formatted_query = format;
  this.latitude = lat;
  this.longitude = lng;
}

//Constructor for Weather
function Day(summary, time) {
  this.forecast = summary;
  this.time = new Date(time *1000).toDateString();
  this.created_at = Date.now();
}

//Constructor for Events
function Event(link, name, event_date, summary){
  this.link = link;
  this.name = name;
  this.event_date = new Date(event_date).toDateString();
  this.summary = summary;
}

//Constructor for MOVIES
function Movie(title, overview, aveVotes, totalVotes, image, popularity, released){
  this.title = title;
  this.overview = overview;
  this.average_votes = aveVotes;
  this.total_votes = totalVotes;
  this.image_url = image;
  this.popularity = popularity;
  this.released_on = released;
}

//Constructor for YELP
function Yelp(name, image, price, rating, url){
  this.name = name;
  this.image_url = image;
  this.price = price;
  this.rating = rating;
  this.url = url;
}

//Constructor for TRAILS
function Trails(name, location, length, stars, votes, summary, url, condition, conDate, conTime){
  this.name = name;
  this.location = location;
  this.length = length;
  this.stars = stars;
  this.star_votes = votes;
  this.summary = summary;
  this.trail_url = url;
  this.condition = condition;
  this.condition_date = conDate;
  this.condition_time = conTime;
}



//Part of LOCATION route
const sqlS = {
  locationInsert: `SELECT * FROM locations WHERE search_query=$1`
}

// =========== LOCATION ROUTE from API ===========

app.get('/location', (request, response) => {
  const query = request.query.data; //request.query is part of the request (NewJohn's hand) and is a vector for questions. It lives in the URL, public info. Postal service of internet. John take the question (lat, lng) because he wants data at a specific lat/lng.

  client.query(sqlS.locationInsert, [query])
    .then(
      sqlResult => {
        if(sqlResult.rowCount > 0) {
          response.send(sqlResult.rows[0]);
          console.log('Data exists! :):):)')
        } else {
          //BEGINNING OF ELSE
          const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API}`;

          superagent.get(urlToVisit).then(responseFromSuper => {
            // console.log('stuff', responseFromSuper.body);
            console.log('WE are querying new data.')
            const geoData = responseFromSuper.body;

            const specificGeoData = geoData.results[0];

            const formatted = specificGeoData.formatted_address;
            const lat = specificGeoData.geometry.location.lat;
            const lng = specificGeoData.geometry.location.lng;

            const newLocation = new Location(query, formatted, lat, lng);

            insertIntoLocationTable(newLocation);

            response.send(newLocation);

          }).catch(error => {
            response.status(500).send(error.message);
            console.error(error);
          })
        }//END OF ELSE
      })
})

// =========== TARGET WEATHER from API ===========

app.get('/weather', getWeather)

//does data exist?
//is it too old --> give to front end
//is it too old? --> get new data
//doesnt exist ---> get new data

function getWeather(request, response){
  const localData = request.query.data;
  const urlDarkSky = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${localData.latitude},${localData.longitude}`;

  client.query(`SELECT * FROM weather WHERE search_query=$1`, [localData.search_query]).then(sqlResult => {

    let notTooOld = true;
    if(sqlResult.rows > 0){
      const age = sqlResult.rows[0].created_at;
      const ageInSeconds = (Date.now() - age)/1000; //Make a global variable and use it here so that is readable.
      if(ageInSeconds > 15){
        notTooOld = false;
        client.query(`DELETE FROM weather WHERE search_query=$1`, [localData.search_query])
      }
      console.log('age in seconds', notTooOld)
    }

    if(sqlResult.rowCount > 0 && notTooOld){
      response.send(sqlResult.rows);
      console.log('Weather Data exists! :):):)')
      //didnt find stuff
    } else {
      superagent.get(urlDarkSky).then(responseFromSuper => {
        const weatherData = responseFromSuper.body;
        // console.log('weather', weatherData);

        const eightDays = weatherData.daily.data;
        const formattedDays = eightDays.map(day => new Day(day.summary, day.time)
        );
        formattedDays.forEach(day => {
          //start the response cycle
          const sqlQueryInsert = `INSERT INTO weather
          (search_query, forecast, time, created_at)
          VALUES 
          ($1, $2, $3, $4);`;
          const valuesArray = [localData.search_query, day.forecast, day.time, day.created_at];
          client.query(sqlQueryInsert, valuesArray);
        })

        response.send(formattedDays);
      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);
      })
    }//end of else
  })
}

// ============ EVENTBRITE from API ==============

app.get('/events', getEvents)
function getEvents(request, response){

  let lastTwentyEvents = [];

  let eventData = request.query.data;
  const urlfromEventbrite = `https://www.eventbriteapi.com/v3/events/search/?sort_by=date&location.latitude=${eventData.latitude}&location.longitude=${eventData.longitude}&token=${process.env.EVENTBRITE_API_KEY}`;
  //WILL REPLACE BELOW
  client.query(`SELECT * FROM events WHERE search_query=$1`, [eventData.search_query]).then(sqlResult => {
    if(sqlResult.rowCount > 0) {
      response.send(sqlResult.rows);
      console.log('Event Data exists! :):):)')
    } else {
      superagent.get(urlfromEventbrite).then(responseFromSuper => {
        const eventbriteData = responseFromSuper.body.events;

        //for loop to only grab 20 things
        for(let i = 0; i < 20; i++) {
          let url = eventbriteData[i].url;
          let name = eventbriteData[i].name.text;
          let eventDate = eventbriteData[i].start.local;
          let eventSummary = eventbriteData[i].description.text;

          const formattedEvents = new Event(url, name, eventDate, eventSummary);

          lastTwentyEvents.push(formattedEvents);
        }

        lastTwentyEvents.forEach(event => {
        //start the response cycle
          const sqlQueryInsert = `INSERT INTO events
        (search_query, link, name, event_date, summary)
        VALUES 
        ($1, $2, $3, $4, $5);`;
          const valuesArray = [eventData.search_query, event.link, event.date, event.event_name, event.summary];
          client.query(sqlQueryInsert, valuesArray);
        })

        response.send(lastTwentyEvents);
      }).catch(error => {
        response.status(500).send(error.message);
        console.error(error);
      })

    }//END OF ELSE
  })
}

// ============= HELPER FUNCTION =======================

//Input: Location object
//Return: Nothing
//Work: Takes in a new location and does nothing.
function insertIntoLocationTable(newLocation){
  //Inserts into SQL Database
  //Insert statement has stand ins of $1 $2 ect for the values that need to go into a query.
  const sqlQueryInsert = `INSERT INTO locations
  (search_query, formatted_query, latitude, longitude)
  VALUES 
  ($1, $2, $3, $4);`;
  //My array needs to have the same amount of things as I have $1, $2, $2, $4, ect
  //$1 === newLocation.search_query
  const valuesArray = [newLocation.search_query, newLocation.formatted_query, newLocation.latitude, newLocation.longitude];

  client.query(sqlQueryInsert, valuesArray);
}

// ===================================================

app.listen(PORT, () => {
  console.log(`app is running on ${PORT}`);
});





/*
Notes from class:

Q: How does JS set a value for a function call?
A:

YOU CAN ONLY CALL '.then' on a 'promise'.
superagent.get fires off and becomes a promise. So return superagent.get(urlToVisit); returns a promise


Cache
Saving stuff for easier use later

Cache hit: the thing  WAS in database.
Cache miss: the thing was NOT already saved in database.

1. Check DB for weather
2. function cache hit.
3. function cache miss.

When do I want to update our database?
location? Never
Weather? hourly, pilots get it everyhour
---you must check weather every 15 seconds.
---you have to test this, so that is why we have it 15 secs
event? daily
yelp? weekly
movies film here? monthly
trails? Daily
*/
