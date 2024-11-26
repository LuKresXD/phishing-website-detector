const { DataTypes } = require('sequelize');
const sequelize = require('../lib/db');

const Scan = sequelize.define('Scan', {
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    virusTotalResult: {
        type: DataTypes.STRING,
        allowNull: false
    },
    virusTotalSafetyScore: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    customResult: {
        type: DataTypes.STRING,
        allowNull: false
    },
    customSafetyScore: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Scan;