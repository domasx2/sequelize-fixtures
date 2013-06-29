module.exports = function (sequelize, DataTypes) {
    return sequelize.define("bar", {
        propA: {type: DataTypes.STRING},
        propB: {type: DataTypes.INTEGER}
    });
};