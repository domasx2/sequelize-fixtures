var Promise = require('bluebird'),
    path    = require('path'),
    yaml    = require('js-yaml'),
    glob    = Promise.promisify(require('glob')),
    fs      = Promise.promisifyAll(require('fs'));

var Reader = module.exports = function (options) {
    options.encoding = options.encoding || 'utf8';
    this.options = options;
};

var PARSERS = Reader.PARSERS = {
    '.json': JSON.parse,
    '.yml': yaml.safeLoad,
    '.yaml': yaml.safeLoad
};

Reader.prototype.readFile = Promise.method(function(filename) {
    this.options.log('Fixtures: reading file ' + filename + '...');
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
