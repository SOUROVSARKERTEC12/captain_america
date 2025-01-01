import { DataTypes } from 'sequelize';
import {sequelize} from '../config/database.config.js';


export const TempAdmin = sequelize.define('TempAdmin', {
    id: {
        type: DataTypes.STRING(100),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    twoFASecret: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isTwoFAEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    firstVisit: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user',
        allowNull: false
    }
});

