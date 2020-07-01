var Promise = require('./Promise');
var Op = require('sequelize').Op;
var objectAssign = require('object-assign');

var logger = require('./logger');

var Loader = module.exports = function(options) {
    this.options = options;
    this.logger = logger(options.log || options.logger);
    this.saved = 0;
    this.skipped = 0;
    this.fixtureModels = {};
};

Loader.prototype.loadFixtures = function(fixtures, models) {
    return Promise.each(fixtures, function(fixture) {
        return this.loadFixture(fixture, models);
    }.bind(this)).then(function() {
        return Promise.resolve({count:this.saved, models:this.fixtureModels});
    }.bind(this));
};

Loader.prototype.loadFixture = function(fixture, models) {
    this.logger.debug(`Loading fixture for model '${fixture.model}:'`, fixture.data);
    var buildOptions = fixture.buildOptions,
        saveOptions = fixture.saveOptions,
        ignoreSet = fixture.ignoreSet,
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
        this.logger.error('Model not found: ' + fixture.model + ' (loaded models are: )' + Object.keys(models));
        throw new Error('Model not found: ' + fixture.model);
    } else if (typeof Model === 'function' && typeof Model.prototype !== 'object') {
        throw new Error('models.' + fixture.model + ' appears to be a function. Perhaps you are importing model factory function? You should then use sequelize.import to create your model, see https://github.com/sequelize/express-example/blob/master/models/index.js#L17');
    } else if (!Model.findOne) {
        throw new Error('models.' + fixture.model + ' is not a sequelize model.');
    }

    return this.prepFixtureData(fixture.data, Model).spread(function(data, many2many) {
        var setManyToMany = function(instance) {
            //set many2many assocs if there are any
            var promises = [];

            if (Object.keys(many2many).length) {
                //each assoc
                Object.keys(many2many).forEach(function(key) {
                    var assoc = Model.associations[key];

                    //each associated instance
                    many2many[key].forEach(function(relinst) {

                        //make options object with transaction if any, through table attrs if any
                        var options = objectAssign({},
                            self.options.transaction ? {transaction: self.options.transaction} : {},
                          { through: relinst._through || {}});

                        //and add related instance
                        promises.push(instance[assoc.accessors.add](relinst.instance, options));
                    });
                });
            }

            return Promise.all(promises);
        };

        var where = {};
        Object.keys(Model.rawAttributes).forEach(function(k) {
            var fieldType = Model.rawAttributes[k].type.constructor.key;
            if (data.hasOwnProperty(k) && (!fixture.keys || fixture.keys.indexOf(k) !== -1) && fieldType !== 'GEOMETRY' && fieldType !== 'GEOGRAPHY' && fieldType !== 'VIRTUAL') {
                //postgres
                if (fieldType === 'JSONB') {
                  where[k] = {};
                  where[k][Op.contains] = data[k];
                } else if (fieldType === 'JSON') {
                    where[k] = JSON.stringify(data[k]);
                } else if (Model.rawAttributes[k].hasOwnProperty('set') && !ignoreSet) {
                    var val = null;
                    // create a simulated setDataValue method, which is commonly
                    // called within setter to update the value after formatting
                    Model.setDataValue = function(name, value) {
                        val = value;
                    }
                    // The model has set defined so it may do some conversion of the data
                    // (e.g. serializing a JSON blob.)
                    // this will fail, however, if OTHER instance methods are called within
                    // the setter, other than setDataValue as defined above
                    try {
                      Model.rawAttributes[k].set.call(Model, data[k]);
                      // don't include VIRTUAL column in filter condition
                      where[k] = val;
                    } catch (err) {
                      throw new Error('Error using Model.set method for model ' + fixture.model + ' property ' + k + ' (possibly due to the use of instance methods). You should use option ignoreSet: true');
                    }
                } else {
                    where[k] = data[k];
                }
            }
        });

        var findOptions = {where: where};
        if (self.options.transaction) {
            findOptions.transaction = self.options.transaction;
        }

        return Model.findOne(findOptions).then(function(instance) {
            if (instance) {
                self.skipped++;
                if (!self.fixtureModels[Model.name]) {
                    self.fixtureModels[Model.name] = [];
                }
                self.fixtureModels[Model.name].push(instance);
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
                        if (!self.fixtureModels[Model.name]) {
                            self.fixtureModels[Model.name] = [];
                        }
                        self.fixtureModels[Model.name].push(instance);

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

    // Allows an external caller to modify the data
    // before it is evaluated
    if (this.options.modifyFixtureDataFn) {
        data = this.options.modifyFixtureDataFn(data, Model);
    }

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
                    assoc.target.findOne(options)
                    .then(function(obj) {
                        result[assoc.identifier] = obj[assoc.target.primaryKeyField || 'id'];
                        return Promise.resolve();
                    })
                );
            } else if (assoc.associationType === 'HasMany' || assoc.associationType === 'BelongsToMany') {

                if (Array.isArray(val)) {
                    many2many[assoc.associationAccessor] = [];
                    val.forEach(function(v) {

                        var options  = {},
                            where,
                            _through = null;

                        //find by fields
                        if (typeof v === 'object') {
                            where = objectAssign({}, v);
                            if (where._through) {
                                _through = where._through;
                                delete where._through;
                            }

                        //find by id
                        } else {
                            where = {};
                            where[assoc.target.primaryKeyField] = v;
                        }

                        options.where = where;

                        if (self.options.transaction) {
                            options.transaction = self.options.transaction;
                        }

                        promises.push(
                            assoc.target.findOne(options)
                            .then(function(obj) {
                                many2many[assoc.associationAccessor].push({
                                    instance: obj,
                                    _through: _through
                                });
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
            if (Model.rawAttributes.hasOwnProperty(key)) {
                result[key] = val;
            } else {
                self.logger.warn('attribute "' + key +"' not defined on  model '" + Model.name + "'.");
            }
        }
    });

    return Promise.all(promises).then(function() {
        return [result, many2many];
    });
};
