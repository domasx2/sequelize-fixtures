module.exports = function (sequelize, DataTypes) {
    return sequelize.define("article", {
        title: {type: DataTypes.STRING},
        slug: {type: DataTypes.STRING, set: function (slug) {
            return this.setDataValue('slug', slug.replace(/[^a-z0-9_-]/, ''));
        }},
        body: {type: DataTypes.TEXT}
    });
};