var { Sequelize, DataTypes } = require("@sequelize/core"),
  sequelize = new Sequelize("database", "username", "password", {
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,
  });

exports.sequelize = sequelize;
exports.all = [];
[
  "Foo",
  "Bar",
  "Article",
  "Person",
  "Project",
  "Actor",
  "Movie",
  "Producer",
  "Play",
  // 'JsonbTestModel',
  "JsonSerializedTestModel",
  "ActorsMovies",
  "Account",
  "SimpleJson",
].forEach(function (model) {
  var mod = require(__dirname + "/" + model)(sequelize, DataTypes);
  module.exports[model] = mod;
  exports.all.push(mod);
});

(function (m) {
  m.Foo.belongsTo(m.Bar);
  m.Bar.hasMany(m.Foo);
  m.Project.belongsToMany(m.Person, { through: "peopleprojects" });
  m.Person.belongsToMany(m.Project, { through: "peopleprojects" });
  m.Actor.belongsToMany(m.Movie, { through: m.ActorsMovies });
  m.Producer.belongsTo(m.Movie);
  m.Movie.hasMany(m.Producer);
  m.Producer.belongsTo(m.Play);
  m.Play.hasMany(m.Producer);
  m.Movie.belongsToMany(m.Actor, { through: m.ActorsMovies });
})(exports);
