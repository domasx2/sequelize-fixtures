var util    = require('util'),
    Promise = require('bluebird');

var Loader = module.exports = function(options) {
    this.options = options;
    this.saved = 0;
    this.skipped = 0;
};

Loader.prototype.loadFixtures = function(fixtures, models, cb) {
    var i = 0,
        self = this;

    function load() {
        if (fixtures.length > i) {
            self.loadFixture(fixtures[i], models, function(err) {
                if (err) throw err;
                else {
                    i++;
                    load();
                }
            });
        } else {
            if (cb) cb();
        }
    }
    load();
};

Loader.prototype.loadFixture = function(fixture, models, cb) {

    var buildOptions = fixture.buildOptions,
        saveOptions = fixture.saveOptions,
        onError = function(err) {
            if (err instanceof Error) {
                throw err;
            } else {
                throw new Error(JSON.stringify(err));
            }
        };

    if (typeof fixture != 'object') throw new Error('expected fixture to be object, is ' + (typeof fixture));
    else if (!fixture.model) throw new Error('model for a fixture is undefined');
    else if (!fixture.data) throw new Error('data undefined for fixture');

    var Model = models[fixture.model],
        self = this;

    if (!Model) {
        throw new Error('Model not found: ' + fixture.model);
    } else {
        this.prepFixtureData(fixture.data, Model).spread(function(data, many2many) {
            var setManyToMany = function(instance) {
                //set many2many assocs if there are any
                if (Object.keys(many2many).length) {
                    var promises = [];
                    Object.keys(many2many).forEach(function(key) {
                        var assoc = Model.associations[key];
                        promises.push(instance[assoc.accessors.set](many2many[key]));
                    });
                    Promise.all(promises).then(function() {
                        if (cb) cb();
                    }).catch(onError);
                } else {
                    if (cb) cb();
                }
            };

            var where = {};
            Object.keys(Model.rawAttributes).forEach(function(k) {
                if (data.hasOwnProperty(k)) {
                    where[k] = data[k]
                }
            });

            Model.find({
                where: where
            }).then(function(instance) {
                if (instance) {
                    self.skipped++;
                    setManyToMany(instance);
                } else {
                    Model.build(data, buildOptions).save(undefined, saveOptions).then(function(instance) {
                        if (instance) {
                            self.saved++;
                            setManyToMany(instance);
                        }
                    }).catch(onError)
                }
            }).catch(onError);
        });
    }
};

Loader.prototype.prepFixtureData = function(data, Model) {
    var result = {},
        promises = [],
        many2many = {};

    // Allows an external caller to do some transforms to the data
    // before it is saved
    if (this.options.transformFixtureDataFn) {
        result = this.options.transformFixtureDataFn(data, Model);
    }

    Object.keys(data).forEach(function(key) {
        var assoc = Model.associations[key],
            val = data[key];
        if (assoc) {
            if (assoc.associationType == 'BelongsTo') {
                promises.push(
                    assoc.target.find(typeof val == 'object' ? {
                        where: val
                    } : val).then(function(obj) {
                        result[assoc.identifier] = obj.id;
                    })
                );
            } else if (assoc.associationType == 'HasMany') {
                if (Array.isArray(val)) {
                    many2many[assoc.associationAccessor] = [];
                    val.forEach(function(v) {
                        promises.push(
                            assoc.target.find(typeof v == 'object' ? {
                                where: v
                            } : v).then(function(obj) {
                                many2many[assoc.associationAccessor].push(obj);
                            })
                        );
                    });
                } else {
                    throw new Error('HasMany associations must be arrays of where clauses');
                }
            } else {
                throw new Error('Only BelongsTo & HasMany associations are supported');
            }

        } else {
            result[key] = val;
        }
    });

    return Promise.all(promises).then(function() {
        return [result, many2many];
    });
};
