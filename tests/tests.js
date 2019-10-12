var sf     = require('../index'),
    should = require('should'),
    models = require('./models'),
    Promise = require('bluebird'),
    sinon = require('sinon')
;

beforeEach(function(){
    return models.sequelize.sync({force: true});
});

var FOO_FIXTURE = {
    model: 'Foo',
    data: {
        propA: 'bar',
        propB: 1
    }
};

var noopLogger = {
  debug: function() {},
  info: function() {},
  warn: function() {},
  error: function() {},
};

var options = {
  logger: noopLogger
};

describe('fixture (with promises)', function() {
    it('should load fixture without id', function() {
        return sf.loadFixture(FOO_FIXTURE, models, options)
            .then(function() {
                return models.Foo.findOne({
                    where: {
                        propA: 'bar',
                        propB: 1
                    }
                });
            }).then(function(foo){
                should.exist(foo);
                foo.propA.should.equal('bar');
                foo.propB.should.equal(1);
            });
    });

    it('should load fixture with id', function() {
        return sf.loadFixture({
            model: 'Foo',
            data: {
                id: 3,
                propA: 'bar',
                propB: 1
            }
        }, models, options).then(function() {
            return models.Foo.findOne({where: {id: 3}});
        }).then(function(foo){
            should.exist(foo);
            foo.propA.should.equal('bar');
            foo.propB.should.equal(1);
        });
    });

    it('should accept buildOptions in fixture', function() {
        return sf.loadFixture({
            model: 'Article',
            buildOptions: { raw: true, isNewRecord: true },
            data: {
                title: 'Any title',
                slug: 'My Invalid Slug'
            }
        }, models, options).then(function() {
            return models.Article.findOne({
                where: {
                    title: 'Any title'
                }
            });
        }).then(function(data) {
            data.slug.should.equal('My Invalid Slug');
        });
    });

    it('should accept saveOptions in fixture', function() {
        return sf.loadFixture({
            model: 'Article',
            saveOptions: { fields: ['title', 'body'] },
            data: {
                title: 'Any title',
                slug: 'my-slug',
                body: 'My nice article'
            }
        }, models, options).then(function() {
            return models.Article.findOne({
                where: {
                    title: 'Any title'
                }
            });
        }).then(function(data) {
            (data.slug === null).should.equal(true);
        });
    });

    it('should not duplicate fixtures', function () {
        return sf.loadFixture(FOO_FIXTURE, models, options)
            .then(function() {
                return sf.loadFixture(FOO_FIXTURE, models, options);
            }).then(function() {
                return models.Foo.count({
                    where: {
                        propA: 'bar'
                    }
                });
            }).then(function(c) {
                c.should.equal(1);
            });
    });

    it('should load multiple fixtures', function() {
        return sf.loadFixtures([FOO_FIXTURE, {
            model: 'Foo',
            data: {
                propA: 'baz',
                propB: 2
            }
        }], models, options).then(function() {
            return models.Foo.count();
        }).then(function(c){
            c.should.equal(2);
        });
    });

    it('should not duplicate fixtures whose keys already exist', function() {
        return sf.loadFixtures([FOO_FIXTURE, {
            model: 'Foo',
            keys: ['propA'],
            data: {
                propA: 'bar',
                propB: 2
            }
        }], models, options).then(function() {
            return models.Foo.count({
                where: {
                    propA: 'bar'
                }
            });
        }).then(function(c){
            c.should.equal(1);
        });
    });

    it('should load fixtures from json', function() {
        return sf.loadFile('tests/fixtures/fixture1.json', models, options)
            .then(function() {
                return models.Foo.count();
            }).then(function(c){
                c.should.equal(2);
                return models.Bar.count();
            }).then(function(c){
                c.should.equal(1);
            });
    });

    it('should return model count and models', function() {
        return sf.loadFile('tests/fixtures/fixture1.json', models, options)
            .then(function(retVal) {
                retVal.count.should.equal(3);
                retVal.models.foo.length.should.equal(2);
                retVal.models.bar.length.should.equal(1);
            });
    });

    it('should load fixtures from js (implied relative)', function() {
        return sf.loadFile('tests/fixtures/fixture1.js', models)
            .then(function() {
                return models.Foo.count();
            }).then(function(c) {
                c.should.equal(2);
                return models.Bar.count();
            }).then(function(c) {
                c.should.equal(1);
            });
    });

    it('should load fixtures from js (explicit relative)', function() {
        return sf.loadFile('./tests/fixtures/fixture1.js', models)
            .then(function() {
                return models.Foo.count();
            }).then(function(c) {
                c.should.equal(2);
                return models.Bar.count();
            }).then(function(c) {
                c.should.equal(1);
            });
    });

    it('should load fixtures from js (absolute)', function() {
        return sf.loadFile(process.cwd() + '/tests/fixtures/fixture1.js', models)
            .then(function() {
                return models.Foo.count();
            }).then(function(c){
                c.should.equal(2);
                return models.Bar.count();
            }).then(function(c){
                c.should.equal(1);
            });
    });

    it('should load fixtures from multiple files via glob', function() {
        return sf.loadFile('tests/fixtures/fixture*.json', models)
            .then(function() {
                return models.Foo.count();
            }).then(function(c){
                c.should.equal(3);
                return models.Bar.count();
            }).then(function(c) {
                c.should.equal(1);
            });
    });

    it('should load fixtures from multiple files', function() {
        return sf.loadFiles(['tests/fixtures/fixture1.json', 'tests/fixtures/fixture2.json'], models)
            .then(function() {
                return models.Foo.count();
            }).then(function(c) {
                c.should.equal(3);
                return models.Bar.count();
            }).then(function(c) {
                c.should.equal(1);
            });
    });

    it('should load yaml fixtures', function() {
        return sf.loadFile('tests/fixtures/fixture3.yaml', models)
            .then(function() {
                return models.Foo.count();
            }).then(function(c) {
                c.should.equal(1);
                return models.Bar.count();
            }).then(function(c) {
                c.should.equal(1);
            });
    });

    it('should throw errors if files are missing', function() {
        return sf.loadFile('tests/fixtures/fixture_that_does_not_exist.json', models)
            .catch(function(err) {
                err.message.should.equal('No files matching \'tests/fixtures/fixture_that_does_not_exist.json\' found.');
            });
    });

    it('should load assosication with. natural keys', function() {
        return sf.loadFile('tests/fixtures/natkeys.yaml', models)
            .then(function() {
                return models.Foo.findAll();
            }).then(function(foos){
                foos.length.should.equal(1);
                return foos[0].getBar();
            }).then(function(bar) {
                bar.propA.should.equal('baz');
                bar.propB.should.equal(1);
            });
    });

    it('should load assosication with. ids', function() {
        return sf.loadFile('tests/fixtures/associd.yaml', models)
            .then(function() {
                return models.Foo.findAll();
            }).then(function(foos) {
                foos.length.should.equal(1);
                foos[0].id.should.equal(303);
                return foos[0].getBar();
            }).then(function(bar) {
                bar.id.should.equal(202);
                bar.propA.should.equal('bb');
            });
    });

    it('should load many2many assocs by nat keys', function() {
        return sf.loadFile('tests/fixtures/many2manynatural.yaml', models)
            .then(function() {
                return models.Project.findOne({
                    where: {
                        name: 'Great Project'
                    }
                });
            }).then(function(project) {
                return project.getPeople();
            }).then(function(persons) {
                persons.length.should.equal(2);
                var foundfirst = false;
                var foundsecond = false;

                persons.forEach(function(dude) {
                    if (dude.name === 'John') {
                        foundfirst = true;
                    }
                    if (dude.name === 'Jack') {
                        foundsecond = true;
                    }
                });
                foundfirst.should.equal(true);
                foundsecond.should.equal(true);
            });
    });

    it('should load belongs 2 many assocs by nat keys', function(done) {
        sf.loadFile('tests/fixtures/many2manynatural.yaml', models).then(function() {
            models.Movie.findOne({
                where: {
                    name: 'Matrix 4'
                }
            }).then(function(movie){
                movie.getActors().then(function(actors){
                    actors.length.should.equal(2);
                    var foundfirst = false;
                    var foundsecond = false;
                    actors.forEach(function(dude){
                        if(dude.name === 'Johnny') {
                            foundfirst = true;
                        }
                        if(dude.name === 'Jack') {
                            foundsecond = true;
                        }
                    });
                    foundfirst.should.equal(true);
                    foundsecond.should.equal(true);
                    done();
                });
            });
        });
    });

    it('should load belongs 2 many assocs by ids', function(done) {
        sf.loadFile('tests/fixtures/many2manyid.yaml', models).then(function() {
            models.Movie.findOne({
                where: {
                    name: 'Matrix 4'
                }
            }).then(function(movie){
                movie.getActors().then(function(actors){
                    actors.length.should.equal(2);
                    var foundfirst = false;
                    var foundsecond = false;
                    actors.forEach(function(dude){
                        if(dude.name === 'Johnny') {
                            foundfirst = true;
                        }
                        if(dude.name === 'Jack') {
                            foundsecond = true;
                        }
                    });
                    foundfirst.should.equal(true);
                    foundsecond.should.equal(true);
                    done();
                });
            });
        });
    });

    it('empty many2many should not break', function() {
        return sf.loadFile('tests/fixtures/many2manynatural.yaml', models)
            .then(function() {
                return models.Project.findOne({
                    where: {
                        name: 'Bad Project'
                    }
                });
            }).then(function(project) {
                return project.getPeople();
            }).then(function(persons) {
                persons.length.should.equal(0);
            });
    });

    it('should load many2many assocs by ids', function() {
        return sf.loadFile('tests/fixtures/many2manyid.yaml', models)
            .then(function() {
                return models.Project.findOne({
                    where: {
                        name: 'Stoopid Project'
                    }
                });
            }).then(function(project) {
                return project.getPeople();
            }).then(function(persons) {
                persons.length.should.equal(2);
                var foundfirst = false;
                var foundsecond = false;
                persons.forEach(function(dude){
                    if(dude.name === 'Prim') {
                        foundfirst = true;
                    }
                    if(dude.name === 'Selena') {
                        foundsecond = true;
                    }
                });
                foundfirst.should.equal(true);
                foundsecond.should.equal(true);
            });
    });

    it('should set many2many even if object already exists', function() {
        return sf.loadFile('tests/fixtures/many2manynatural.yaml', models)
            .then(function() {
                return models.Project.findOne({
                    where: {
                        name: 'Bad Project'
                    }
                });
            }).then(function(project) {
                return project.getPeople();
            }).then(function(persons) {
                persons.length.should.equal(0);
                return sf.loadFixture({
                    model: 'Project',
                    data: {
                        name: 'Bad Project',
                        people: [
                            {
                                name: 'John'
                            },
                            {
                                name: 'Jack'
                            }
                        ]
                    }
                }, models);
            }).then(function() {
                return models.Project.findAll({
                    where: {
                        name: 'Bad Project'
                    }
                });
            }).then(function(projects){
                projects.length.should.equal(1);
                return projects[0].getPeople();
            }).then(function(persons){
                persons.length.should.equal(2);
            });
    });

    it('should handle primary keys not named "id" for has many', function() {
        return sf.loadFile('tests/fixtures/custompk.yaml', models)
            .then(function() {
                return models.Movie.findOne({
                    where: {
                        name: 'Pirates of the Baltic Sea'
                    }
                });
            }).then(function(movie){
                return movie.getProducers();
            }).then(function(producers){
                producers.length.should.equal(1);
                producers[0].name.should.equal('Somethingstein');
            });
    });

    it('should handle primary keys not named "id" for belongs to', function() {
        return sf.loadFile('tests/fixtures/custompk.yaml', models)
            .then(function() {
                return models.Play.findOne({
                    where: {
                        name: 'Book of Jesus'
                    }
                });
            }).then(function(movie){
                return movie.getProducers();
            }).then(function(producers){
                producers.length.should.equal(1);
                producers[0].name.should.equal('Arnie');
            });
    });

    it('if transaction specified, it should be passed to models', function(done) {
        var FooMock = sinon.mock(models.Foo),
            findDeferred = Promise.defer(),
            saveDeferred = Promise.defer(),
            data = {id: 3},
            instance = models.Foo.build(),
            instanceMock = sinon.mock(instance)
        ;

        models.sequelize.transaction(function(t) {
            FooMock.expects('findOne').once().returns(findDeferred.promise).withExactArgs({
                where : data,
                transaction : t
            });
            findDeferred.resolve(null);

            FooMock.expects('build').once().returns(instance);
            instanceMock.expects('save').once().withExactArgs({
                transaction : t
            }).returns(saveDeferred.promise);
            saveDeferred.resolve(null);

            return sf.loadFixture({
                model: 'Foo',
                data: data
            }, models, {transaction : t});
        })
        .then(function() {
            instanceMock.verify();
            FooMock.verify();
            FooMock.restore();
            done();
        });
    });

    it('if transaction specified, should load many2many assocs by nat keys', function(done) {
        models.sequelize.transaction(function(t) {
            return sf.loadFile('tests/fixtures/many2manynatural.yaml', models, {transaction : t});
        }).then(function() {
            return models.Project.findOne({
                where: {
                    name: 'Great Project'
                }
            });
        }).then(function(project) {
            return project.getPeople();
        }).then(function(persons) {
            persons.length.should.equal(2);
            var foundfirst = false;
            var foundsecond = false;

            persons.forEach(function(dude) {
                if (dude.name === 'John') {
                    foundfirst = true;
                }
                if (dude.name === 'Jack') {
                    foundsecond = true;
                }
            });
            foundfirst.should.equal(true);
            foundsecond.should.equal(true);
        }).then(done);
    });

    it('should load fixtures and then transform their values', function() {
        return sf.loadFile('tests/fixtures/fixture1.json', models, {
            transformFixtureDataFn: function (data, model) {
                if (model.name === 'bar') {
                  data.propB = 99;
                }
                return data;
            }
        }).then(function() {
            return models.Bar.findAll();
        }).then(function(bars){
            bars.forEach(function(bar) {
              bar.propB.should.equal(99);
            });
        });
    });

    it('should load user modified fixtures', function() {
        return sf.loadFile('tests/fixtures/fixture1.json', models, {
            modifyFixtureDataFn: function (data, model) {
                if (model.name === 'foo') {
                  delete data.propB;
                  data.status = true;
                }
                return data;
            }
        }).then(function() {
            return models.Foo.findAll();
        }).then(function(foos){
            foos.forEach(function(foo) {
              (foo.propB === null).should.equal(true);
              foo.status.should.equal(true);
            });
        });
    });

    it('should add attributes to many2many through table', function() {
        return sf.loadFixtures([
            {
                model: 'Movie',
                data: {
                    id:1,
                    name: 'Terminator'
                }
            },
            {

                model: 'Actor',
                data: {
                    id: 1,
                    name: 'Arnie',
                    movies: [
                        {
                            name: 'Terminator',
                            _through: {
                                character: 'T-80'
                            }
                        }
                    ]
                }
            }
        ], models)
        .then(function() {
            return models.Actor.findOne({
                where: {
                    name: 'Arnie'
                }
            });
        })
        .then(function(arnie) {
            should.exist(arnie);
            return arnie.getMovies();
        })
        .then(function(movies) {
            should.exist(movies);
            movies.length.should.equal(1);
            should.exist(movies[0].ActorsMovies.character);
            movies[0].ActorsMovies.character.should.equal('T-80');
        });
    });

    it('should perform a set operation if one exists', function() {
      return sf.loadFile('tests/fixtures/serializedJsonFixture.js', models)
        .then(function() {
            return models.JsonSerializedTestModel.findAll();
        }).then(function(models) {
            models.length.should.equal(1);
            models[0].permissions.should.match({'*': '*'});
        });
    });

    it('should add attributes to many2many through table using ids', function() {
        return sf.loadFixtures([
            {
                model: 'Movie',
                data: {
                    id:3,
                    name: 'Terminator'
                }
            },
            {

                model: 'Actor',
                data: {
                    id: 1,
                    name: 'Arnie',
                    movies: [
                        {
                            id: 3,
                            _through: {
                                character: 'T-80'
                            }
                        }
                    ]
                }
            }
        ], models)
        .then(function() {
            return models.Actor.findOne({
                where: {
                    name: 'Arnie'
                }
            });
        })
        .then(function(arnie) {
            should.exist(arnie);
            return arnie.getMovies();
        })
        .then(function(movies) {
            should.exist(movies);
            movies.length.should.equal(1);
            should.exist(movies[0].ActorsMovies.character);
            movies[0].ActorsMovies.character.should.equal('T-80');
        });
    });

    it('should exclude VIRTUAL columns from filter condition', function() {
      return sf.loadFile('tests/fixtures/virtual.js', models)
        .then(function() {
          return models.Account.findOne({
            where: {
              name: 'John'
            }
          });
        }).then(function(account) {
          should.exist(account);
        });
    });

    it('should handle json including arrays', function() {
      return sf.loadFile('tests/fixtures/jsonContainingArray.js', models)
        .then(function() {
            return models.SimpleJson.findAll();
        }).then(function(models) {
            models.length.should.equal(1);
            models[0].props.should.match({"home": ["latest", "get"]});
        });
    });
    /* postgres only
    it('should handle jsonb fields', function() {
        return  sf.loadFile('tests/fixtures/jsonb.json', models)
        .then(function() {
            return sf.loadFile('tests/fixtures/jsonb.json', models);
        })
        .then(function() {
            return models.JsonbTestModel.findAll();
        })
        .then(function(result) {
            result.length.should.equal(1);
            JSON.stringify(result[0].props).should.equal(JSON.stringify({
                "a": {
                    "b":1,
                },
                "b": [1, {"c":2}]
            }));
        });
    });
    */
});
