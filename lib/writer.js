var Promise = require('bluebird'),
  path = require('path'),
  yaml = require('js-yaml'),
  fs = Promise.promisifyAll(require('fs')),
  util = require('util');

var Writer = module.exports = function (options) {
  options.encoding = options.encoding || 'utf8';
  this.options = options;
};

function deepFreeze(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(deepFreeze);
  } else if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(function (key) {
      deepFreeze(obj[key]);
    });
  }
  return obj;
}

var STRINGIFYERS = Writer.STRINGIFYERS = {
  '.js': function (contents) {
    return (
      deepFreeze.toString() + '\n' +
      'module.exports = deepFreeze(' + util.inspect(contents, false, null) + ');'
    );
  },
  '.json': JSON.stringify,
  '.yml': yaml.safeDump,
  '.yaml': yaml.safeDump
};

Writer.prototype.writeFile = Promise.method(function (filename, contents) {
  this.options.log('Fixtures: writing file ' + filename + '...');
  var ext = path.extname(filename).toLowerCase();
  if (!STRINGIFYERS[ext]) {
    throw new Error('unknown file type: ', ext);
  }

  var stringifyed = STRINGIFYERS[ext](contents);

  return fs.writeFileAsync(filename, stringifyed, this.options.encoding);
});
