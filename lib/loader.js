var Promise = require('bluebird');

var Loader = module.exports = function(options) {
    this.options = options;
    this.saved = 0;
    this.skipped = 0;
};

Loader.prototype.loadFixtures = function(fixtures, models) {
    return Promise.each(fixtures, function(fixture) {
        return this.loadFixture(fixture, models);
    }.bind(this)).then(function() {
        return Promise.resolve(this.saved);
    }.bind(this));
};

Loader.prototype.loadFixture = function(fixture, models) {
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
                    var options = self.options.transaction ? {transaction: self.options.transaction} : {};
                    promises.push(instance[assoc.accessors.set](many2many[key], options));
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

        var findOptions = {where: where};
        if (self.options.transaction) {
            findOptions.transaction = self.options.transaction;
        }

        return Model.find(findOptions).then(function(instance) {
            if (instance) {
                self.skipped++;
                return setManyToMany(instance);
            }

            if (self.options.transaction) {
                if (!saveOptions) {
                    saveOptions = {};
                }
                saveOptions.transaction = self.options.transaction;
            }

            return Model
                .build(data, buildOptions)
                .save(saveOptions).then(function(instance) {
                    if (instance) {
                        self.saved++;
                        return setManyToMany(instance);
                    }
                });
        });
    });
};

Loader.prototype.prepFixtureData = function(data, Model) {
    var self = this,
        result = {},
        promises = [],
        many2many = {};

    // Allows an external caller to do some transforms to the data
    // before it is saved
    if (this.options.transformFixtureDataFn) {
        result = this.options.transformFixtureDataFn(data, Model);
    }

    Object.keys(data).forEach(function(key) {
        var foundInThroughName = null;
        // For Sequelize < 3.0.0 compatibility (using for instance "actorsmovies" instead of "actors" or "movies")
        Object.keys(Model.associations).forEach(function(assoc_name) {
            if(Model.associations[assoc_name].options && (Model.associations[assoc_name].options.through == key || Model.associations[assoc_name].options.as == key)) {
                return foundInThroughName = assoc_name;
            }
        });
        var assoc = Model.associations[foundInThroughName || key],
            val = data[key];

        if (assoc) {
            if (assoc.associationType === 'BelongsTo') {
                var where = {};
                where[assoc.target.primaryKeyField] = val;

                var options = typeof val === 'object' ? { where: val } : { where: where };
                if (self.options.transaction)
                    options.transaction = self.options.transaction;

                promises.push(
                    (typeof val === 'object' ?  assoc.target.find(options) : assoc.target.findOne(options))
                    .then(function(obj) {
                        result[assoc.identifier] = obj[assoc.target.primaryKeyField || 'id'];
                        return Promise.resolve();
                    })
                );
            } else if (assoc.associationType === 'HasMany' || assoc.associationType === 'BelongsToMany') {

                if (Array.isArray(val)) {
                    many2many[assoc.associationAccessor] = [];
                    val.forEach(function(v) {
                        var where = {};
                        where[assoc.target.primaryKeyField] = v;
                        var options = typeof v === 'object' ? { where: v } : { where: where };
                        if (self.options.transaction)
                            options.transaction = self.options.transaction;
                        promises.push(
                            (typeof v === 'object' ?  assoc.target.find(options) : assoc.target.findOne(options))
                            .then(function(obj) {
                                many2many[assoc.associationAccessor].push(obj);
                                return Promise.resolve();
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
            if (Model.attributes.hasOwnProperty(key)) {
                result[key] = val;
            } else {
                console.warn('attribute "' + key +"' not defined on  model '" + Model.name + "'.");
            }
        }
    });

    return Promise.all(promises).then(function() {
        return [result, many2many];
    });
};
