module.exports = function (sequelize, DataTypes) {
  return sequelize.define("simple_json", {
      props: {type: DataTypes.JSON}
  });
};