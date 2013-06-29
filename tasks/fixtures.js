var sf = require('../index');

module.exports = function(grunt) {
    grunt.task.registerMultiTask('fixtures', 'Load fixtures', function () {
        var data = this.data,
            models = data.models,
            done = this.async(),
            options = data.options  || {};
        if(typeof models == 'string') models = require(models);
        else if(models.call) models = models();
        if(Array.isArray(data.files)){
            var ff = files.slice(0);
            function proc(){
                if(!ff.length) done();
                else {
                    sf.load(ff.shift(), options, function(err){
                        if(err) throw err;
                        else proc();
                    });
                }
            }
        } else {
            sf.load(data.files, models, options, function (err) {
                if(err) throw err;
                else done();
            });
        }
    });
};