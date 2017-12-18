var Loader = require('./lib/loader'),
  Reader = require('./lib/reader'),
  Writer = require('./lib/writer');

function initopts(options){
    options = options || {};
    options.encoding = options.encoding || 'utf8';
    options.log = options.log || console.log;
    return options;
}

function wrap(fn) {
    return function() {
        if (arguments.length < 2) {
            throw new Error('Insufficient arguments');
        } else {
            var fixtures = arguments[0], models = arguments[1], options, i, cb, promise;
            for(i = 2; i < arguments.length; i++) {
                if (typeof arguments[i] === 'object') options = arguments[i];
                else if (typeof arguments[i] === 'function') cb = arguments[i];
            }
            promise = fn(fixtures, models, initopts(options));
            if (cb) {
                console.warn("Sequelize-fixtures: callback arguments are deprecated, please use returned promises.");
                promise.then(function () {
                    cb();
                }, function (err) {
                    cb(err);
                }).catch(function (err){
                    cb(err);
                });
            }
            return promise;
        }
    };
}

exports.loadFixture = wrap(function (fixture, models, options) {
  return exports.loadFixtures([fixture], models, options);
});

exports.loadFixtures = wrap(function (fixtures, models, options) {
  var loader = new Loader(options);
  return loader.loadFixtures(fixtures, models)
    .then(function (result) {
      if (!options.referenceFile) {
        return result;
      }

      var writer = new Writer(options);
      return writer.writeFile(options.referenceFile, loader.reference)
        .then(function () {
          return result;
        });
    });
});

exports.loadFile = wrap(function (filename, models, options) {
  var reader = new Reader(options);
  return reader.readFileGlob(filename)
    .then(function (fixtures) {
      return exports.loadFixtures(fixtures, models, options);
    });
});

exports.loadFiles = wrap(function (filenames, models, options) {
  var reader = new Reader(options);
  return reader.readFiles(filenames)
    .then(function (fixtures) {
      return exports.loadFixtures(fixtures, models, options);
    });
});
