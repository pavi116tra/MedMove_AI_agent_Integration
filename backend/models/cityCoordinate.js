'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CityCoordinate extends Model {}
  CityCoordinate.init({
    city_name: { type: DataTypes.STRING, allowNull: false, unique: true },
    lat: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
    lon: { type: DataTypes.DECIMAL(11, 8), allowNull: false }
  }, {
    sequelize,
    modelName: 'CityCoordinate',
    tableName: 'city_coordinates'
  });
  return CityCoordinate;
};
