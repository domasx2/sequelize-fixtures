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
    // From Sequelize 3.0.0 changelog:
    // "[REMOVED] N:M relationships can no longer be represented by 2 x hasMany" 
    // Settings constraints to false to keep this working
    m.Project.hasMany(m.Person, {constraints: false});
    m.Person.hasMany(m.Project, {constraints: false});
    m.Actor.belongsToMany(m.Movie, {through: 'actorsmovies'});
    m.Movie.belongsToMany(m.Actor, {through: 'actorsmovies'});
})(exports);