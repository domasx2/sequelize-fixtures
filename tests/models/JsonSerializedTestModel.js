module.exports = function (sequelize, DataTypes) {
    return sequelize.define("serialized_json_test_model", {
        permissions: {
          type: DataTypes.TEXT,
          get: function() {
            return JSON.parse(this.getDataValue('permissions'));
          },
          set: function(val) {
            this.setDataValue('permissions', JSON.stringify(val));
          },
        },
    });
};
