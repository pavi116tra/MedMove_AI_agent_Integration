'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ambulance extends Model {
    static associate(models) {
      Ambulance.belongsTo(models.Provider, { foreignKey: 'provider_id' });
      Ambulance.hasMany(models.Booking, { foreignKey: 'ambulance_id' });
    }
  }
  Ambulance.init({
    vehicle_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('basic', 'oxygen', 'icu'),
      allowNull: false
    },
    driver_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    driver_phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    base_location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    base_charge: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    price_per_km: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('available', 'booked', 'on_trip', 'maintenance'),
      defaultValue: 'available'
    },
    equipment: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    provider_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Ambulance',
  });
  return Ambulance;
};
