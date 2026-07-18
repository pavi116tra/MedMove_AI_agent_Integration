'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecurringBooking extends Model {
    static associate(models) {
      RecurringBooking.belongsTo(models.User, { foreignKey: 'patient_id' });
    }
  }
  RecurringBooking.init({
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    route_from: { type: DataTypes.STRING, allowNull: false },
    route_to: { type: DataTypes.STRING, allowNull: false },
    vehicle_type: { type: DataTypes.STRING, allowNull: false },
    days_of_week: { type: DataTypes.JSON, allowNull: false },
    preferred_time: { type: DataTypes.STRING, allowNull: false },
    active_until: { type: DataTypes.DATEONLY, allowNull: false }
  }, {
    sequelize,
    modelName: 'RecurringBooking',
    tableName: 'recurring_bookings'
  });
  return RecurringBooking;
};
