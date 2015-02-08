var Loader = require('./lib/loader'),
    Reader = require('./lib/reader');

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
            var fixtures = arguments[0], models = arguments[1], options, cb, i;
            for(i = 2; i < arguments.length; i++) {
                if (typeof arguments[i] === 'object') options = arguments[i];
                else if (typeof arguments[i] === 'function') cb = arguments[i];
            }
            return fn(fixtures, models, initopts(options), cb);
        }
    };
}

exports.loadFixture = wrap(function(fixture, models, options, cb) {
    var loader = new Loader(options);
    return loader.loadFixture(fixture, models, cb);
});

exports.loadFixtures = wrap(function(fixtures, models, options, cb) {
    var loader = new Loader(options);
    return loader.loadFixtures(fixtures, models,  cb);
});

exports.loadFile = wrap(function(filename, models, options, cb) {
    var loader = new Loader(options), reader = new Reader(options);
    return reader.readFileGlob(filename).then(function(fixtures) {
        return loader.loadFixtures(fixtures, models, cb);
    });
});

exports.loadFiles = wrap(function(filenames, models, options, cb) {
    var loader = new Loader(options), reader = new Reader(options);
    return reader.readFiles(filenames).then(function(fixtures){
        return loader.loadFixtures(fixtures, models, cb);
    });
});
