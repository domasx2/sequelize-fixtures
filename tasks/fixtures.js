var sf = require('../index');
var objectAssign = require('object-assign');
var logger = require('./../lib/logger');

module.exports = function(grunt) {
    grunt.task.registerMultiTask('fixtures', 'Load fixtures', function() {
        var taskInstance = this,
            data = this.data,
            models = data.models,
            done = this.async(),
            options = data.options,
            loadFiles = function(models) {
                var sources = [];
                taskInstance.files.forEach(function(f) {
                    [].push.apply(sources, f.src);
                });
                if (sources.length) {
                    sf.loadFiles(sources, models, options)
                        .then(function(result) {
                            grunt.log.ok(result.count + ' fixtures loaded.');
                            done();
                        });
                } else {
                    throw new Error('no sources provided');
                }
            };

        // link grunt logging to internal, if not specified
        options.logger = options.logger || {
          debug: grunt.verbose.writeln,
          info: grunt.log.writeln,
          warn: grunt.fail.warn,
          error: grunt.fail.fatal,
        };

        if (typeof models == 'string') {
            grunt.verbose.writeln('Loading models using file path: ' + models);
            models = require(models);
        } else if (models.call) {
            grunt.verbose.writeln('Loading models using function callback...');
            models = models.call(taskInstance, options);
            if (models.then) {
              models.then(function(loadedModels) {
                return loadFiles(loadedModels);
              });
            } else {
              loadFiles(models);
            }
        }

    });
};
