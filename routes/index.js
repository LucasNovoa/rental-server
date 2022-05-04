const express = require('express');

const usersRouter = require('./users.router');
const hotelsRouter = require('./hotels.router');
const authRouter = require('./auth.router');

const router = express.Router();

router.use('/users', usersRouter);
router.use('/hotels', hotelsRouter);
router.use('/auth', authRouter);

module.exports = router;
