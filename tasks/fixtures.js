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

        var sources = [];
        this.files.forEach(function(f){
            [].push.apply(sources, f.src);
        });
        if(sources.length){
            loader = sf.loadFiles(sources, models, options, callback);
        } else {
            throw new Error('no sources provided');
        }
    });
};