module.exports = function (sequelize, DataTypes) {
    return sequelize.define("producer", {
        producer_id: {type: DataTypes.STRING, primaryKey: true},
        name: {type: DataTypes.STRING}
    });
};