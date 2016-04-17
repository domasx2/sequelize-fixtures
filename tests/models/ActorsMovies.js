module.exports = function (sequelize, DataTypes) {
    return sequelize.define("ActorsMovies", {
        character: {type: DataTypes.STRING}
    });
};