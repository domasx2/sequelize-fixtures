var Loader = require('./lib/loader'),
    Reader = require('./lib/reader');

function initopts(options){
    options = options || {};
    options.encoding = options.encoding || 'utf8';
    options.log = options.log || console.log;
    return options;
}

function wrap(fn){
    return function(){
        if(arguments.length < 2){
            throw new error('Insufficient arguments');
        } else {
            var fixtures = arguments[0], models = arguments[1], options, cb, i;
            for(i=2;i<arguments.length;i++){
                if(typeof arguments[i] == 'object') options = arguments[i];
                else if (typeof arguments[i] == 'function') cb = arguments[i];
            }
            return fn(fixtures, models, initopts(options), cb);
        }
    };
}


exports.loadFixture = wrap(function (fixture, models, options, cb) {
    var loader = new Loader(options);
    loader.loadFixture(fixture, models, cb);
    return loader;
});

exports.loadFixtures = wrap(function (fixtures, models, options, cb) {
    var loader = new Loader(options);
    loader.loadFixtures(fixtures, models,  cb);
    return loader;
});

exports.loadFile = wrap(function (filename, models, options, cb) {
    var loader = new Loader(options), reader = new Reader(options);
    reader.readFileGlob(filename, function(fixtures){
        loader.loadFixtures(fixtures, models, cb);
    });
    return loader;
});

exports.loadFiles = wrap(function (filenames, models, options, cb) {
    var loader = new Loader(options), reader = new Reader(options);
    reader.readFiles(filenames, function(fixtures){
        loader.loadFixtures(fixtures, models, cb);
    });
    return loader;
});