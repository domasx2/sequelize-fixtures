var sf = require('../index');

module.exports = function(grunt) {
    grunt.task.registerMultiTask('fixtures', 'Load fixtures', function () {
        var data = this.data,
            models = data.models,
            done = this.async(),
            options = data.options  || {},
            loader;
        if(typeof models == 'string') models = require(models);
        else if(models.call) models = models();

        var callback = function () {
            console.log(loader.saved+' fixtures loaded.');
            done();
        };

        if(Array.isArray(data.from)){
            loader = sf.loadFiles(data.from, models, options, callback);
        } else if (data.from) {
            loader = sf.loadFile(data.from, models, options, callback);
        } else {
            throw new error('missing "from" argument');
        }
    });
};