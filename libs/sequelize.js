const { Sequelize } = require('sequelize');

const { config } = require('../config/config');

const setupModels = require('../database/models');

// const URI = `postgres://${USER}:${PASSWORD}@${config.dbHost}:${config.dbPort}/${config.dbName}`;

const options = {
  dialect: 'postgres',
  logging: !config.isProd,
};

if (config.isProd) {
  options.ssl = {
    rejectUnauthorized: false,
  };
}

const sequelize = new Sequelize(config.dbUrl, options);

setupModels(sequelize);

sequelize.sync();

module.exports = sequelize;
