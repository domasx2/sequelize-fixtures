var sf = require('../index'),
    should = require('should'),
    models = require('./models');

beforeEach(function() {
    return models.sequelize.drop().then(function(){
        models.sequelize.sync();
    });
});

var FOO_FIXTURE = {
    model: 'Foo',
    data: {
        propA: 'bar',
        propB: 1
    }
};

describe('fixtures (with callbacks)', function(){
    it('should load fixture without id', function(done){
        sf.loadFixture(FOO_FIXTURE, models, function (){
            models.Foo.find({
                where: {
                    propA: 'bar',
                    propB: 1
                }
            }).then(function(foo){
                should.exist(foo);
                foo.propA.should.equal('bar');
                foo.propB.should.equal(1);
                done();
            });
        });
    });

    it('should load fixture with id', function(done){
        sf.loadFixture({
            model: 'Foo',
            data: {
                id: 3,
                propA: 'bar',
                propB: 1
            }
        }, models, function (err){
            should.not.exist(err);
            models.Foo.find(3).then(function(foo){
                should.exist(foo);
                foo.propA.should.equal('bar');
                foo.propB.should.equal(1);
                done();
            });
        });
    });

    it('should accept buildOptions in fixture', function(done){
        sf.loadFixture({
            model: 'Article',
            buildOptions: { raw: true, isNewRecord: true },
            data: {
                title: 'Any title',
                slug: 'My Invalid Slug'
            }
        }, models, function (err) {
            models.Article.find({
                where: {
                    title: 'Any title'
                }
            }).then(function (data) {
                data.slug.should.equal('My Invalid Slug');
                done();
            });
        });
    });

    it('should accept saveOptions in fixture', function(done){
        sf.loadFixture({
            model: 'Article',
            saveOptions: { fields: ['title', 'body'] },
            data: {
                title: 'Any title',
                slug: 'my-slug',
                body: 'My nice article'
            }
        }, models, function (err) {
            models.Article.find({
                where: {
                    title: 'Any title'
                }
            }).then(function (data) {
                (data.slug === null).should.equal(true);
                done();
            });
        });
    });

    it('should not duplicate fixtures', function (done){
        sf.loadFixture(FOO_FIXTURE, models, function (){
            sf.loadFixture(FOO_FIXTURE, models, function (){
                models.Foo.count({
                    where: {
                        propA: 'bar'
                    }
                }).then(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should load multiple fixtures', function(done) {
        sf.loadFixtures([FOO_FIXTURE, {
            model: 'Foo',
            data: {
                propA: 'baz',
                propB: 2
            }
        }], models, function (err){
            should.not.exist(err);
            models.Foo.count().then(function(c){
                c.should.equal(2);
                done();
            });
        });
    });

    it('should load fixtures from json', function(done){
        sf.loadFile('tests/fixtures/fixture1.json', models, function(){
            models.Foo.count().then(function(c){
                c.should.equal(2);
                models.Bar.count().then(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should load fixtures from js (implied relative)', function(done){
        sf.loadFile('tests/fixtures/fixture1.js', models, function(){
            models.Foo.count().then(function(c){
                c.should.equal(2);
                models.Bar.count().then(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should load fixtures from js (explicit relative)', function(done){
        sf.loadFile('./tests/fixtures/fixture1.js', models, function(){
            models.Foo.count().then(function(c){
                c.should.equal(2);
                models.Bar.count().then(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should load fixtures from js (absolute)', function(done){
        sf.loadFile(process.cwd() + '/tests/fixtures/fixture1.js', models, function(){
            models.Foo.count().then(function(c){
                c.should.equal(2);
                models.Bar.count().then(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should load fixtures from multiple files via glob', function(done){
        sf.loadFile('tests/fixtures/fixture*.json', models, function(){
            should.not.exist();
            models.Foo.count().then(function(c){
                c.should.equal(3);
                models.Bar.count().then(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should load fixtures from multiple files', function(done){
        sf.loadFiles(['tests/fixtures/fixture1.json', 'tests/fixtures/fixture2.json'], models, function(){
            should.not.exist();
            models.Foo.count().then(function(c){
                c.should.equal(3);
                models.Bar.count().then(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should load yaml fixtures', function(done){
        sf.loadFile('tests/fixtures/fixture3.yaml', models, function(){
            models.Foo.count().then(function(c){
                c.should.equal(1);
                models.Bar.count().then(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should load assosication with. natural keys', function(done){
        sf.loadFile('tests/fixtures/natkeys.yaml', models, function(){
            models.Foo.findAll().then(function(foos){
                foos.length.should.equal(1);
                foos[0].getBar().then(function(bar){
                    bar.propA.should.equal('baz');
                    bar.propB.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should load assosication with. ids', function(done){
        sf.loadFile('tests/fixtures/associd.yaml', models, function(){
            models.Foo.findAll().then(function(foos){
                foos.length.should.equal(1);
                foos[0].id.should.equal(303);
                foos[0].getBar().then(function(bar){
                    bar.id.should.equal(202);
                    bar.propA.should.equal('bb');
                    done();
                });
            });
        });
    });

    it('should load many2many assocs by nat keys', function(done) {
        sf.loadFile('tests/fixtures/many2manynatural.yaml', models, function() {
            models.Project.find({
                where: {
                    name: 'Great Project'
                }
            }).then(function(project){
                project.getPeople().then(function(persons){
                    persons.length.should.equal(2);
                    var foundfirst = false;
                    var foundsecond = false;
                    persons.forEach(function(dude){
                        if(dude.name === 'John') {
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

    it('empty many2many should not break', function(done) {
        sf.loadFile('tests/fixtures/many2manynatural.yaml', models, function() {
            models.Project.find({
                where: {
                    name: 'Bad Project'
                }
            }).then(function(project){
                project.getPeople().then(function(persons){
                    persons.length.should.equal(0);
                    done();
                });
            });
        });
    });

    it('should load many2many assocs by ids', function(done) {
        sf.loadFile('tests/fixtures/many2manyid.yaml', models, function() {
            models.Project.find({
                where: {
                    name: 'Stoopid Project'
                }
            }).then(function(project){
                project.getPeople().then(function(persons){
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
                    done();
                });
            });
        });
    });

    it('should set many2many even if object already exists', function(done) {
        sf.loadFile('tests/fixtures/many2manynatural.yaml', models, function() {
            models.Project.find({
                where: {
                    name: 'Bad Project'
                }
            }).then(function(project){
                project.getPeople().then(function(persons){
                    persons.length.should.equal(0);
                    sf.loadFixture({
                        model: 'Project',
                        data: {
                            name: 'Bad Project',
                            peopleprojects: [
                                {
                                    name: 'John'
                                },
                                {
                                    name: 'Jack'
                                }
                            ]
                        }
                    }, models, function() {
                        models.Project.findAll({
                            where: {
                                name: 'Bad Project'
                            }
                        }).then(function(projects){
                            projects.length.should.equal(1);
                            projects[0].getPeople().then(function(persons){
                                persons.length.should.equal(2);
                                done();
                            });
                        });

                    });
                });
            });
        });
    });
});
