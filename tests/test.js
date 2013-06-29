var sf = require('../index'),
    should = require('should'),
    models = require('./models');

beforeEach(function(done){
    models.sequelize.drop().success(function(){
        models.sequelize.sync().success(function(){
            done();
        });
    });
});

var FOO_FIXTURE = {
    model: 'Foo',
    data: {
        propA: 'bar',
        propB: 1
    }
};

describe('fixtures', function(){
    it('should save fixture without id', function(done){
        sf.load([FOO_FIXTURE], models, function (err){
            should.not.exist(err);
            models.Foo.find({
                where: {
                    propA: 'bar',
                    propB: 1
                }
            }).success(function(foo){
                should.exist(foo);
                foo.propA.should.equal('bar');
                foo.propB.should.equal(1);
                done();
            });
        });
    });

    it('should save fixture with id', function(done){
        sf.load([{
            model: 'Foo',
            data: {
                id: 3,
                propA: 'bar',
                propB: 1
            }
        }], models, function (err){
            should.not.exist(err);
            models.Foo.find(3).success(function(foo){
                should.exist(foo);
                foo.propA.should.equal('bar');
                foo.propB.should.equal(1);
                done();
            });
        });
    });

    it('should not duplicate fixtures', function (done){
        sf.load([FOO_FIXTURE], models, function (err){
            should.not.exist(err);
            sf.load([FOO_FIXTURE], models, function (err){
                models.Foo.count({
                    where: {
                        propA: 'bar'
                    }
                }).success(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should save multiple fixtures', function(done) {
        sf.load([FOO_FIXTURE, {
            model: 'Foo',
            data: {
                propA: 'baz',
                propB: 2
            }
        }], models, function (err){
            should.not.exist(err);
            models.Foo.count().success(function(c){
                c.should.equal(2);
                done();
            });
        });
    });

    it('should save fixtures from json', function(done){
        sf.load('tests/fixtures/fixture1.json', models, function(err){
            should.not.exist(err);
            models.Foo.count().success(function(c){
                c.should.equal(2);
                models.Bar.count().success(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should save fixtures from multiple files via glob', function(done){
        sf.load('tests/fixtures/*.json', models, function(err){
            should.not.exist(err);
            models.Foo.count().success(function(c){
                c.should.equal(3);
                models.Bar.count().success(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });

    it('should load yaml fixtures', function(done){
        sf.load('tests/fixtures/fixture3.yaml', models, function(err){
            should.not.exist(err);
            models.Foo.count().success(function(c){
                c.should.equal(1);
                models.Bar.count().success(function(c){
                    c.should.equal(1);
                    done();
                });
            });
        });
    });
});