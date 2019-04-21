var Promise;
try {
  Promise = require('sequelize').Promise;
  if (!Promise) throw new Error();
} catch (err) {
  Promise = require('bluebird');
}

module.exports = Promise;