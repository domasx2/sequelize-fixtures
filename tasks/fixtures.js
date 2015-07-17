var sf = require('../index');

module.exports = function(grunt) {
    grunt.task.registerMultiTask('fixtures', 'Load fixtures', function () {
        var data = this.data,
            models = data.models,
            done = this.async(),
            options = data.options  || {},
            loader;

        if (typeof models == 'string') {
            models = require(models);
        } else if (models.call) {
            models = models();
        }

        var sources = [];
        this.files.forEach(function(f){
            [].push.apply(sources, f.src);
        });
        if (sources.length) {
            sf.loadFiles(sources, models, options).then(function(saved){
                console.log(saved+' fixtures loaded.');
                done();
            });
        } else {
            throw new Error('no sources provided');
        }
    });
};