'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PriceWatch extends Model {
    static associate(models) {
      PriceWatch.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }
  PriceWatch.init({
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    route_from: { type: DataTypes.STRING, allowNull: false },
    route_to: { type: DataTypes.STRING, allowNull: false },
    travel_date: { type: DataTypes.STRING, allowNull: false },
    vehicle_type: { type: DataTypes.STRING, allowNull: false },
    watched_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    alert_message: { type: DataTypes.TEXT, allowNull: true },
    alert_seen: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    sequelize,
    modelName: 'PriceWatch',
    tableName: 'price_watches'
  });
  return PriceWatch;
};
