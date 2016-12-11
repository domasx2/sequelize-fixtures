module.exports = function (sequelize, DataTypes) {
    return sequelize.define("account", {
        name: {type: DataTypes.STRING},
        password_plain: {
            type: DataTypes.VIRTUAL, 
            allowNull: false,
            set: function (val) {
                this.setDataValue("password_plain", val);
                this.setDataValue("password", val + "some_hash");
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
};