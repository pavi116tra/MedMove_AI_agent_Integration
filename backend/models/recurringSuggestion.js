'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RecurringSuggestion extends Model {
    static associate(models) {
      RecurringSuggestion.belongsTo(models.User, { foreignKey: 'patient_id' });
    }
  }
  RecurringSuggestion.init({
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    route_from: { type: DataTypes.STRING, allowNull: false },
    route_to: { type: DataTypes.STRING, allowNull: false },
    vehicle_type: { type: DataTypes.STRING, allowNull: false },
    suggested_date: { type: DataTypes.DATEONLY, allowNull: false },
    dismissed: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    sequelize,
    modelName: 'RecurringSuggestion',
    tableName: 'recurring_suggestions'
  });
  return RecurringSuggestion;
};
