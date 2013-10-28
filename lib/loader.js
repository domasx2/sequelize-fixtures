var util = require('util'),
    q = require('q');


var Loader = module.exports = function(options){
    this.options = options;
    this.saved = 0;
    this.skipped = 0;
};

Loader.prototype.loadFixtures = function (fixtures, models, cb) {
    var i = 0, self = this;
    function load(){
        if(fixtures.length > i){
            self.loadFixture(fixtures[i], models, function(err){
                if(err) throw err;
                else {
                    i++;
                    load();
                }
            });
        } else {
            if(cb) cb();
        }
    }
    load();
};

Loader.prototype.loadFixture = function (fixture, models, cb) {
    if(typeof fixture != 'object') throw new Error('expected fixture to be object, is ' + (typeof fixture));
    else if(!fixture.model) throw new Error('model for a fixture is undefined');
    else if(!fixture.data) throw new Error('data undefined for fixture');
    var Model = models[fixture.model], self = this;
    if(!Model) {
        throw new Error('Model not found: '+fixture.model);
    } else {
        this.prepFixtureData(fixture.data, Model, function(data){
            Model.findOrCreate(data, data).success(function(instance, saved){
                if(saved) self.saved++;
                else self.skipped++;
                if(cb) cb();
            }).error(function(err){
                throw new Error(err);
            });
        });
    }
};

Loader.prototype.prepFixtureData = function(data, Model, cb){
    var result = {}, promises = [], errors = [];
    
    // Allows an external caller to do some transforms to the data 
    // before it is saved
    if(this.options.transformFixtureDataFn) {
        result = this.options.transformFixtureDataFn(data, Model);
    }
    
    Object.keys(data).forEach(function(key){
        var assoc = Model.associations[key], val = data[key];
        if(assoc){
            if(typeof val == 'object'){
                if(assoc.associationType == 'BelongsTo'){
                    var def = q.defer();
                    promises.push(def.promise);
                    assoc.target.find(val).success(function(obj){
                        result[assoc.identifier] = obj.id;
                        def.resolve();
                    }).error(function(err){
                        throw err;
                    });
                } else {
                    throw new Error('Only BelongsTo association type is supported for natural keys:(');
                }
            } else {
                throw new Error (key+' for '+Model.name+' is type '+(typeof val)+', expected object.');
            }
        } else {
            if(Model.rawAttributes[key]){
                result[key] = val;
            } else {
                throw new Error('Model '+Model.name+' does not have attribute '+key+'!');
            }
        }
    });

    q.all(promises).then(function(){
        cb(result);
    });
};
