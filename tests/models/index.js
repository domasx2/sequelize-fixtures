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
    m.Project.hasMany(m.Person);
    m.Person.hasMany(m.Project);
    m.Actor.belongsToMany(m.Movie);
    m.Movie.belongsToMany(m.Actor);
})(exports);