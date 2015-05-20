var Sequelize = require('sequelize'),
    sequelize = new Sequelize('database', 'username', 'password', {
        dialect: 'sqlite',
        storage: 'testdb.sqlite',
        logging: false
});

exports.sequelize = sequelize;
exports.all = [];
['Foo', 'Bar', 'Article', 'Person', 'Project', 'Actor', 'Movie'].forEach( function (model) {
    var mod = sequelize.import(__dirname + '/' + model);
    module.exports[model] = mod;
    exports.all.push(mod);
});

(function (m) {
    m.Foo.belongsTo(m.Bar);
    m.Bar.hasMany(m.Foo);
    m.Project.belongsToMany(m.Person, {through: 'peopleprojects'});
    m.Person.belongsToMany(m.Project, {through: 'peopleprojects'});
    m.Actor.belongsToMany(m.Movie, {through: 'actorsmovies'});
    m.Movie.belongsToMany(m.Actor, {through: 'actorsmovies'});
})(exports);