var glob = require('glob'),
    path = require('path'),
    yaml = require('js-yaml'),
    fs = require('fs');

var PARSERS = exports.PARSERS = {
    '.json': JSON.parse,
    '.yml': yaml.safeLoad,
    '.yaml': yaml.safeLoad
};

function loadFixtures (fixtures, models, cb) {
    var i = 0;
    function load(){
        loadFixture(fixtures[i], models, function(err){
            if(err) cb(err);
            else {
                if(fixtures.length > ++i){
                    load();
                } else {
                    cb();
                }
            }
        });
    }
    if(fixtures.length) load();
    else cb();
};

function loadFixture (fixture, models, cb) {
    if( !(typeof fixture == 'object')) cb('expected fixture to be object, is ' + (typeof fixture));
    else if(!fixture.model) cb('model for a fixture is undefined');
    else if(!fixture.data) cb('data undefined for fixture');
    var Model = models[fixture.model];
    if(!Model) {
        cb('Model not found: '+fixture.model);
    } else {
        Model.findOrCreate(fixture.data, fixture.data).success(function(){
            cb();
        }).error(function(err){
            cb(err);
        });
    }
};

function readFiles(globpath, options, cb) {
    glob(globpath, function(err, filenames){
        if(err) cb(err);
        else {
            var queue = [], data = [], err;
            err = filenames.some(function(filename){
                var ext = path.extname(filename).toLowerCase();
                if(!PARSERS[ext]) {
                    cb('unknown file type: ', ext);
                    return true;
                }
                queue.push({
                    filename: filename, 
                    parser: PARSERS[ext]
                });
            });
            if(!err){
                function readFile () {
                    var args = queue.shift();
                    fs.readFile(args.filename, options.encoding || 'utf8', function(err, d){
                        if(err) cb(err);
                        else {
                            d = args.parser(d);
                            if(d.fixtures) d = d.fixtures;
                            d.forEach(function(x){
                                data.push(x);
                            });
                            if(queue.length){
                                readFile();
                            } else {
                                cb(null, data);
                            }
                        }
                    });
                }
                if(queue.length) {
                    readFile();
                } else {
                    cb(null, []);
                }
            }
        }
    });
};

exports.load = function(fixtures, models, options, cb) {
    if(!cb) {
        cb = options;
        options = {};
    }

    cb = cb || function(){};

    if(Array.isArray(fixtures)){
        loadFixtures(fixtures, models, cb);
    } else if (typeof fixtures == 'string') {
        readFiles(fixtures, options, function(err, fixtures){
            if(err) cb(err);
            else {
                loadFixtures(fixtures, models, cb);
            }
        });
    }
};