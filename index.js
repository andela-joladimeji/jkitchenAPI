require('dotenv').config();
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const logger = require('morgan')
const redis = require('redis');
let client
if (process.env.REDIS_URL) {
  client = redis.createClient(process.env.REDIS_URL, {no_ready_check: true});
} else {
  client = redis.createClient();
}

client.on('connect', () => {
  console.log('connected');
});

app.use(logger('dev'));
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});
const PORT = parseInt(process.env.PORT, 10) || 3000;
require('./server/routes/user-routes')(app);
require('./server/routes/meal-routes')(app);
require('./server/routes/rating-routes')(app);
require('./server/routes/order-routes')(app);

app.listen(PORT, (err) => {
  if (err) {
    // logger
  }
  console.log(`The server is running on localhost PORT: ${PORT}`);
});

module.exports = app;
