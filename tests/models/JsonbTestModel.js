module.exports = function (sequelize, DataTypes) {
    return sequelize.define("jsonb_test_model", {
        props: {type: DataTypes.JSONB},
    });
};