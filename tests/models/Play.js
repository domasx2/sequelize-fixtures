module.exports = function (sequelize, DataTypes) {
    return sequelize.define("play", {
        play_id: {type: DataTypes.STRING, primaryKey: true},
        name: {type: DataTypes.STRING}
    });
};