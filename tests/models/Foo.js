module.exports = function (sequelize, DataTypes) {
    return sequelize.define("foo", {
        propA: {type: DataTypes.STRING},
        propB: {type: DataTypes.INTEGER},
        status: {type: DataTypes.BOOLEAN}
    });
};