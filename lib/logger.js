'use strict';

var objectAssign = require('object-assign');

var defaultLogger = {
  debug: function() {},
  info: console.log,
  warn: console.log,
  error: console.error,
};

module.exports = function(logger) {
  if ('function' === typeof logger) {
    return objectAssign(defaultLogger, {
      info: logger,
      warn: logger,
      error: logger,
    });
  } else if ('object' === typeof logger) {
    return objectAssign(defaultLogger, logger);
  } else {
    return defaultLogger;
  }
};
