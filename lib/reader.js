var Promise = require('./Promise');
var path = require('path');
var yaml = require('js-yaml');
var objectAssign = require('object-assign');
var glob = Promise.promisify(require('glob'));
var fs = Promise.promisifyAll(require('fs'));
var logger = require('./logger');

var Reader = module.exports = function (options) {
    options.encoding = options.encoding || 'utf8';
    this.options = options;
    this.logger = logger(options.log || options.logger);
};

var PARSERS = Reader.PARSERS = {
    '.json': JSON.parse,
    '.yml': yaml.safeLoad,
    '.yaml': yaml.safeLoad
};

Reader.prototype.readFile = Promise.method(function(filename) {
    this.logger.debug('Fixtures: reading file ' + filename + '...');
    var ext = path.extname(filename).toLowerCase();

    if (ext === '.js') {
        return require(path.resolve(process.cwd(), filename));
    } else {
        if (!PARSERS[ext]) {
            throw new Error('unknown file type: ', ext);
        }
        return fs.readFileAsync(filename, this.options.encoding).then(function(data) {
            var fixtures = PARSERS[ext](data);
            if (fixtures.fixtures) fixtures = fixtures.fixtures;
            return fixtures;
        });
    }
});

Reader.prototype.readFileGlob = function(globpath){
    var self = this, result = [];
    return glob(globpath).then(function(filenames) {
        if (!filenames.length) {
            throw new Error("No files matching '" + globpath + "' found.");
        }
        return Promise.each(filenames, function(filename) {
            return self.readFile(filename).then(function(res) {
                result = result.concat(res);
            });
        }).then(function() {
            return result;
        });
    });
};

Reader.prototype.readFiles = function(filenames){
    var self = this, result = [];
    return Promise.each(filenames, function(filename) {
        return self.readFileGlob(filename).then(function(res) {
            result = result.concat(res);
        });
    }).then(function() {
        return result;
    });
};
