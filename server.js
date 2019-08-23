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

const MS_IN_SEC = 1000;
const SEC_IN_HOUR = 3600;
const SEC_IN_DAY = 3600 * 24;

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
function Eventbrite(link, name, event_date, summary){
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
  this.image_url = `https://image.tmdb.org/t/p/w500${image}`;
  this.popularity = popularity;
  this.released_on = released;
}

//Constructor for YELP
function Yelp(yelp){ //name, image, price, rating, url
  this.name = yelp.name;
  this.image_url = yelp.image;
  this.price = yelp.price;
  this.rating = yelp.rating;
  this.url = yelp.url;
}

// //Constructor for TRAILS
// function Trails(name, location, length, stars, votes, summary, url, condition, conDate, conTime){
//   this.name = name;
//   this.location = location;
//   this.length = length;
//   this.stars = stars;
//   this.star_votes = votes;
//   this.summary = summary;
//   this.trail_url = url;
//   this.condition = condition;
//   this.condition_date = conDate;
//   this.condition_time = conTime;
// }

//Start of functions

//===================== ALL UPDATES ===================

function updateLocation(query, request, response) {
  const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API}`
  superagent.get(urlToVisit).then(responseFromSuper => {

    // I simply replaced my geodata require, with the data in the body of my superagent response
    const geoData = responseFromSuper.body;
    const specificGeoData = geoData.results[0];
    const newLocation = new Location(
      query,
      specificGeoData.formatted_address,
      specificGeoData.geometry.location.lat,
      specificGeoData.geometry.location.lng
    )

    //Logging data into the SQL DB
    const sqlQueryInsert = `
      INSERT INTO locations (search_query, formatted_query, latitude, longitude, created_at)
      VALUES ($1, $2, $3, $4, $5);`;
    const valuesArray = [newLocation.search_query, newLocation.formatted_query, newLocation.latitude, newLocation.longitude, now()];

    //client.query takes in a string and array and smooshes them into a proper sql statement that it sends to the db
    client.query(sqlQueryInsert, valuesArray);
    response.send(newLocation);
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  })
}

function updateWeather(query, request, response){
  const urlToVisit = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`
  superagent.get(urlToVisit).then(responseFromSuper => {
    const formattedDays = responseFromSuper.body.daily.data.map(
      day => new Day(day.summary, day.time)
    );
    response.send(formattedDays);

    //Logging data into the SQL DB
    formattedDays.forEach(day => {
      const sqlQueryInsert = `
        INSERT INTO weather (search_query, forecast, time, created_at)
        VALUES ($1, $2, $3, $4);`;
      const valuesArray = [query.search_query, day.forecast, day.time, now()]

      //client.query takes in a string and array and smooshes them into a proper sql statement that it sends to the db
      client.query(sqlQueryInsert, valuesArray);
    })
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  });
}

function updateEvents(query, request, response){
  const urlToVisit = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${request.query.data.longitude}&location.latitude=${request.query.data.latitude}&token=${process.env.EVENTBRITE_API_KEY}`;
  superagent.get(urlToVisit).then(responseFromSuper => {
    const formattedEvent = responseFromSuper.body.events.map(
      event => new Eventbrite(event.url, event.name.text, event.start.local, event.summary)
    );
    response.send(formattedEvent);
    //Logging data into the SQL DB
    formattedEvent.forEach(event => {
      const sqlQueryInsert = `
        INSERT INTO events (search_query, link, name, event_date, summary, created_at)
        VALUES ($1, $2, $3, $4, $5, $6);`;
      const valuesArray = [query.search_query, event.link, event.name, event.event_date, event.summary, now()];

      //client.query takes in a string and array and smooshes them into a proper sql statement that it sends to the db
      client.query(sqlQueryInsert, valuesArray);
    })
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  })
}

function updateMovies(query, request, response){
  const urlToVisit = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${query.search_query}`;
  superagent.get(urlToVisit).then(responseFromSuper => {
    const formattedMovies = responseFromSuper.body.results.map(
      movie => new Movie(movie.title, movie.overview, movie.vote_average, movie.vote_count, movie.poster_path, movie.popularity, movie.release_date)
    );
    response.send(formattedMovies);
    //logging into SQL db
    formattedMovies.forEach(movie => {
      const sqlQueryInsert = `INSERT INTO movies (search_query, title, overview, average_votes, total_votes, image_url, popularity, released_on)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
      const valuesArray = [query.search_query, movie.title, movie.overview, movie.average_votes, movie.total_votes, movie.poster_path, movie.popularity, movie.released_on];

      client.query(sqlQueryInsert, valuesArray);
    })
  }).catch(error => {
    response.status(500).send(error.message);
    console.error(error);
  })
}

function updateYelp (query, request, response){
  const yelpData = `https://api.yelp.com/v3/businesses/search?latitude=${query.latitude}&longitude=${query.longitude}`
  superagent.get(yelpData)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`).then(responseFromSuper => {
      const yelpReviews = responseFromSuper.body.businesses.slice(0,20).map(yelp => new Yelp(yelp)
      );
      response.send(yelpReviews);

      const whatever = responseFromSuper.body.businesses;
      console.log(whatever);

      yelpReviews.forEach(review => {
        const sqlQueryInsert = `INSERT INTO reviews (search_query, name, image_url, price, rating, url)
      VALUES ($1, $2, $3, $4, $5, $6);`;
        const valuesArray = [query.search_query, review.name, review.image_url, review.price, review.rating, review.url];//must match data

        client.query(sqlQueryInsert, valuesArray);
      })
    }).catch(error => {
      console.log(response);
      response.status(500).send('This is an error!!!!!!!!');
      console.error(error);
    })
}

//===================== ALL GETS ===================

function getLocation(request, response) {
  const query = request.query.data;
  client.query(`SELECT * FROM locations WHERE search_query=$1`, [query]).then(sqlResult => {
    if(sqlResult.rowCount > 0){
      response.send(sqlResult.rows[0]);
    } else {
      updateLocation(query, request, response);
    }
  });
}
function getWeather(request, response){
  const query = request.query.data;
  client.query(`SELECT * FROM weather WHERE search_query=$1`, [query.search_query]).then(sqlResult => {
    if(sqlResult.rowCount > 0){
      if (isOlderThan(sqlResult.rows, 15)) {
        console.log('Refreshing old weather data');
        deleteRows(sqlResult.rows, 'weather');
        updateWeather(query, request, response);
      } else {
        response.send(sqlResult.rows);
      }
    } else {
      updateWeather(query, request, response);
    }
  });
}

function getEvents(request, response) {
  const query = request.query.data;
  client.query(`SELECT * FROM events WHERE search_query=$1`, [query.search_query]).then(sqlResult => {
    if(sqlResult.rowCount > 0){
      if (isOlderThan(sqlResult.rows, SEC_IN_DAY)) {
        deleteRows(sqlResult.rows, 'events');
        updateEvents(query, request, response);
      } else {
        response.send(sqlResult.rows);
      }
    } else {
      updateEvents(query, request, response);
    }
  });
}

function getMovies(request, response){
  const query = request.query.data;
  client.query(`SELECT * FROM movies WHERE search_query=$1`, [query.search_query]).then(sqlResult => {
    if(sqlResult.rowCount > 0){
      response.send(sqlResult.rows);
    }else {
      updateMovies(query, request, response);
    }
  });
}

function getYelp(request, response){
  const query = request.query.data;
  client.query(`SELECT * FROM reviews WHERE search_query=$1`, [query.search_query]).then(sqlResult => {
    if(sqlResult.rowCount > 0){
      response.send(sqlResult.rows);
    }else {
      updateYelp(query, request, response);
    }
  });
}

//===================== HELPER FUNCTIONS ===================

function now() {
  // seconds now
  return Math.floor((new Date()).valueOf() / MS_IN_SEC);
}

function deleteRows(rows, table) {
  const deleteQuery = `
    DELETE FROM ${table}
    WHERE id IN (${rows.map(row => row.id).join(',')});`;
  client.query(deleteQuery, []);
}

function isOlderThan(rows, seconds){
  for(let i = 0; i<rows.length; i++){
    if(parseInt(rows[i].created_at) + seconds < now()) {
      // at least one of the rows is older than
      return true;
    }
  }
  // none of the rows is older than
  return false;
}

//===================== EXECUTABLE CODE ===================

app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/events', getEvents);
app.get('/movies', getMovies);
app.get('/yelp', getYelp);
// app.get('/trails', getTrails);

app.listen(PORT, () => {console.log(`app is up on PORT ${PORT}`)});



// ==================================================================

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
