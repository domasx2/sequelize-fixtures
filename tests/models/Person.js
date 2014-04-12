module.exports = function (sequelize, DataTypes) {
    return sequelize.define("person", {
        name: {type: DataTypes.STRING},
        role: {type: DataTypes.STRING}
    });
};