'use strict'

const express = require('express');
require('dotenv').config()
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT;

app.get('/location', (req, res) => {
  try {

    const dataFromGoogle = require('./data/geo.json');
    const searchQuery = req.query.data;
    const formattedQuery = dataFromGoogle.results[0].formatted_address;
    const lat = dataFromGoogle.results[0].geometry.location.lat;
    const lng = dataFromGoogle.results[0].geometry.location.lng;

    const formattedData = {
      search_query: searchQuery,
      formatted_query: formattedQuery,
      latitude: lat,
      longitude: lng,
    };
    res.send(formattedData);

  } catch (error) {
    console.error(error);
  }
})

// ======= TARGET WEATHER in JSON FILE =======

app.get('/weather', (req, res) => {
  try {

    const datafromDarkSky = require('./data/darksky.json');
    const time = datafromDarkSky.currently.time;
    const forcast = datafromDarkSky.currently.summary;

    const formattedData = {
      time: time,
      forcast: forcast,
    };
    res.send(formattedData);

  } catch (error) {
    console.error(error);
  }
})



// ====================================

app.listen(PORT, () => {
  console.log(`app is running on ${PORT}`);
});
