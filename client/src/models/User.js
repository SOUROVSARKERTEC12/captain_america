import {DataTypes} from 'sequelize';
import sequelize from '../config/database.config.js';

export const User = sequelize.define('User', {
        id: {
            type: DataTypes.STRING(100),
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        firstName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        nidFront: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        nidBack: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        role: {
            type: DataTypes.STRING(255),
            defaultValue: 'user',
            allowNull: false,
        },
        twoFASecret: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        isTwoFAEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        firstVisit: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'verified', 'rejected'),
            defaultValue: 'pending',
            allowNull: false,
        },
    },
    {
        tableName: 'Users',
        timestamps: true,
    });


