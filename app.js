require('dotenv').config();
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const logger = require('morgan')
const log4js = require('log4js')
log4js.configure({
  appenders: {
    console: { type: 'console' }
  },
  categories: {
    another: { appenders: ['console'], level: 'error' },
    default: { appenders: ['console'], level: 'trace' }
  }
});

const log4jsLogger = log4js.getLogger();


const redis = require('redis');

let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient(process.env.REDIS_URL, {no_ready_check: true});
} else {
  redisClient = redis.createClient();
}

redisClient.on('connect', () => {
  log4jsLogger.info('connected');
});

app.use(logger('dev'));
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

require('./routes/user-routes')(app);
require('./routes/meal-routes')(app);
require('./routes/rating-routes')(app);
require('./routes/order-routes')(app);

function requestHandler(req, res) {
  res.setHeader( 'X-XSS-Protection', '1; mode=block' );
}
// function requestHandler(req, res) {
//   res.setHeader('Strict-Transport-Security', 'max-age=630720; includeSubDomains; preload');
// }
app.use((req, res, next)  => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

const PORT = parseInt(process.env.PORT, 10) || 3000;
app.listen(PORT, (err) => {
  if (err) {
    log4jsLogger.error(`Error starting the app:${err}`)
  }
  log4jsLogger.info(`The server is running on localhost PORT: ${PORT}`);
});
app.get('*', (req, res) => res.status(200).send({
  message: 'Welcome',
}));
module.exports = app;
