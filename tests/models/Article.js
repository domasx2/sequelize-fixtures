module.exports = function (sequelize, DataTypes) {
    return sequelize.define("article", {
        title: {type: DataTypes.STRING},
        slug: {type: DataTypes.STRING},
        body: {type: DataTypes.TEXT}
    });
};