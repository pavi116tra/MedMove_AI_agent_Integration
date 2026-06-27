'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.User, { foreignKey: 'user_id' });
      Booking.belongsTo(models.Ambulance, { foreignKey: 'ambulance_id' });
      Booking.belongsTo(models.Provider, { foreignKey: 'provider_id' });
    }
  }
  Booking.init({
    // Who booked
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    full_name: { type: DataTypes.STRING, allowNull: false },
    user_phone: { type: DataTypes.STRING, allowNull: false },

    // Which ambulance
    ambulance_id: { type: DataTypes.INTEGER, allowNull: false },
    provider_id: { type: DataTypes.INTEGER, allowNull: false },
    vehicle_number: { type: DataTypes.STRING, allowNull: false },
    ambulance_type: { type: DataTypes.STRING, allowNull: false },
    driver_name: { type: DataTypes.STRING, allowNull: false },
    driver_phone: { type: DataTypes.STRING, allowNull: false },
    company_name: { type: DataTypes.STRING, allowNull: false },

    // Trip details
    pickup_location: { type: DataTypes.STRING, allowNull: false },
    drop_location: { type: DataTypes.STRING, allowNull: false },
    booking_date: { type: DataTypes.DATEONLY, allowNull: false },
    booking_time: { type: DataTypes.TIME, allowNull: false },
    distance_km: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },

    // Patient details
    patient_name: { type: DataTypes.STRING, allowNull: false },
    patient_age: { type: DataTypes.INTEGER, allowNull: false },
    patient_condition: { type: DataTypes.TEXT },
    need_oxygen: { type: DataTypes.BOOLEAN, defaultValue: false },
    wheelchair: { type: DataTypes.BOOLEAN, defaultValue: false },
    special_notes: { type: DataTypes.TEXT },

    // Payment
    base_charge: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    distance_charge: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    payment_method: { type: DataTypes.STRING, defaultValue: 'qr_scan' },
    payment_status: { type: DataTypes.STRING, defaultValue: 'paid' },

    // Status
    status: { 
      type: DataTypes.STRING, 
      defaultValue: 'confirmed' 
    }
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};
