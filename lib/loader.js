var Promise = require('bluebird');

var Loader = module.exports = function(options) {
    this.options = options;
    this.saved = 0;
    this.skipped = 0;
};

Loader.prototype.loadFixtures = function(fixtures, models, cb) {
    return Promise.each(fixtures, function(fixture) {
        return this.loadFixture(fixture, models);
    }.bind(this)).then(function() {
        if (cb) cb();
    });
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

    if (typeof fixture !== 'object') throw new Error('expected fixture to be object, is ' + (typeof fixture));
    else if (!fixture.model) throw new Error('model for a fixture is undefined');
    else if (!fixture.data) throw new Error('data undefined for fixture');

    var Model = models[fixture.model],
        self = this;

    if (!Model) {
        throw new Error('Model not found: ' + fixture.model);
    }

    return this.prepFixtureData(fixture.data, Model).spread(function(data, many2many) {
        var setManyToMany = function(instance) {
            //set many2many assocs if there are any
            var promises = [];

            if (Object.keys(many2many).length) {
                Object.keys(many2many).forEach(function(key) {
                    var assoc = Model.associations[key];
                    promises.push(instance[assoc.accessors.set](many2many[key]));
                });
            }

            return Promise.all(promises);
        };

        var where = {};
        Object.keys(Model.rawAttributes).forEach(function(k) {
            if (data.hasOwnProperty(k) && (!fixture.keys || fixture.keys.indexOf(k) !== -1)) {
                where[k] = data[k];
            }
        });

        return Model.find({
            where: where
        }).then(function(instance) {
            if (instance) {
                self.skipped++;
                return setManyToMany(instance);
            }

            return Model
                .build(data, buildOptions)
                .save(saveOptions).then(function(instance) {
                    if (instance) {
                        self.saved++;
                        return setManyToMany(instance);
                    }
                });
        }).then(function() {
            if (cb) cb();
        }).catch(onError);
    });
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
            if (assoc.associationType === 'BelongsTo') {
                promises.push(
                    assoc.target.find(typeof val === 'object' ? {
                        where: val
                    } : {where: {id: val}}).then(function(obj) {
                        result[assoc.identifier] = obj.id;
                    })
                );
            } else if (assoc.associationType === 'HasMany' || assoc.associationType === 'BelongsToMany') {
                if (Array.isArray(val)) {
                    many2many[assoc.associationAccessor] = [];
                    val.forEach(function(v) {
                        promises.push(
                            assoc.target.find(typeof v === 'object' ? {
                                where: v
                            } : {where: {id: v}}).then(function(obj) {
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
