var glob = require('glob'),
    path = require('path'),
    yaml = require('js-yaml'),
    fs = require('fs');

var Reader = module.exports = function (options) {
    options.encoding = options.encoding || 'utf8';
    this.options = options;
};

var PARSERS = Reader.PARSERS = {
    '.json': JSON.parse,
    '.yml': yaml.safeLoad,
    '.yaml': yaml.safeLoad
};

Reader.prototype.readFile = function(filename, cb){
    this.options.log('Fixtures: reading file '+filename+'...');
    var ext = path.extname(filename).toLowerCase();
    if(!PARSERS[ext]) {
        throw new Error('unknown file type: ', ext);
    }
    fs.readFile(filename, this.options.encoding, function(err, data){
        if(err) throw err;
        var fixtures = PARSERS[ext](data);
        if(fixtures.fixtures) fixtures = fixtures.fixtures;
        cb(fixtures);
    });
};

Reader.prototype.readFileGlob = function(globpath, cb){
    var self = this, result = [];
    glob(globpath, function(err, filenames){
        if(err) throw err;
        else {
            var read = function(){
                if(filenames.length){
                    self.readFile(filenames.shift(), function(res){
                        result = result.concat(res);
                        read();
                    });
                } else {
                    cb(result);
                }
            };
            read();
        }
    });
};

Reader.prototype.readFiles = function(filenames, cb){
    var queue = filenames.slice(0), result = [], self = this;
    function read(){
        if(queue.length) {
            self.readFileGlob(queue.shift(), function(res){
                result = result.concat(res);
                read();
            });
        } else {
            cb(result);
        }
    }
    read();
};