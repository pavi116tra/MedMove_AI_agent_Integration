'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProviderEarning extends Model {
    static associate(models) {
      ProviderEarning.belongsTo(models.Provider, { foreignKey: 'provider_id' });
      ProviderEarning.belongsTo(models.Booking, { foreignKey: 'booking_id' });
    }
  }
  ProviderEarning.init({
    provider_id: { type: DataTypes.INTEGER, allowNull: false },
    company_name: { type: DataTypes.STRING, allowNull: false },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    booked_by_name: { type: DataTypes.STRING, allowNull: false },
    booked_by_phone: { type: DataTypes.STRING, allowNull: false },
    vehicle_number: { type: DataTypes.STRING, allowNull: false },
    ambulance_type: { type: DataTypes.STRING, allowNull: false },
    driver_name: { type: DataTypes.STRING, allowNull: false },
    pickup_location: { type: DataTypes.STRING, allowNull: false },
    drop_location: { type: DataTypes.STRING, allowNull: false },
    booking_date: { type: DataTypes.DATEONLY, allowNull: false },
    booking_time: { type: DataTypes.TIME, allowNull: false },
    day_of_week: { type: DataTypes.STRING, allowNull: false },
    distance_km: { type: DataTypes.DECIMAL(10, 2) },
    total_fare: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    trip_status: { type: DataTypes.STRING, defaultValue: 'confirmed' }
  }, {
    sequelize,
    modelName: 'ProviderEarning',
    tableName: 'provider_earnings'
  });
  return ProviderEarning;
};
