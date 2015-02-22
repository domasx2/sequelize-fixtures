module.exports = function (sequelize, DataTypes) {
    return sequelize.define("movie", {
        name: {type: DataTypes.STRING}
    });
};