module.exports = function (sequelize, DataTypes) {
    return sequelize.define("project", {
        name: {type: DataTypes.STRING},
        duration: {type: DataTypes.INTEGER}
    });
};