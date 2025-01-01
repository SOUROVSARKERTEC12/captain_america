import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.config.js';

const TableB = sequelize.define('TableB', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: 'TableB',
    timestamps: false, // Disable timestamps if not needed
});

export default TableB;
