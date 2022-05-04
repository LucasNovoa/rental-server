const express = require('express');

const cors = require('cors');

const router = require('./routes/index');

const {
  logErrors, errorHandler, boomErrorHandler, ormErrorHandler,
} = require('./middlewares/error.handler');

const app = express();

app.use(express.json());

const whitelist = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

const corsOptions = {
  origin(origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not Allowed By CORS'));
    }
  },
};

app.use(cors(corsOptions));

require('./utils/auth');

app.use('/api/v1', router);

app.use(logErrors);

app.use(ormErrorHandler);

app.use(boomErrorHandler);

app.use(errorHandler);

module.exports = app;
