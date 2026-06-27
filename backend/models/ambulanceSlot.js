'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AmbulanceSlot extends Model {
    static associate(models) {
      AmbulanceSlot.belongsTo(models.Ambulance, { foreignKey: 'ambulance_id' });
      AmbulanceSlot.belongsTo(models.Booking, { foreignKey: 'booking_id' });
    }
  }
  AmbulanceSlot.init({
    ambulance_id: { type: DataTypes.INTEGER, allowNull: false },
    booking_id: { type: DataTypes.INTEGER, allowNull: false },
    booking_date: { type: DataTypes.DATEONLY, allowNull: false },
    booking_time: { type: DataTypes.TIME, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'blocked' }
  }, {
    sequelize,
    modelName: 'AmbulanceSlot',
    tableName: 'ambulance_slots'
  });
  return AmbulanceSlot;
};
