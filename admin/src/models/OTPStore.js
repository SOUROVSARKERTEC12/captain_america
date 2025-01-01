import {DataTypes} from 'sequelize';
import {sequelize} from '../config/database.config.js';
import {TempAdmin} from "./tempAdmin.js";


const OTPStore = sequelize.define('OTPStore', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        otp: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true
        },
        resendCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: true
        }
    },
    {
        tableName: 'otpStore',
        timestamps: true
    });


OTPStore.belongsTo(TempAdmin, {foreignKey: 'tempAdminId', as: 'adminId', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
TempAdmin.hasMany(OTPStore, {foreignKey: 'tempAdminId', as: 'adminOTP', onDelete: 'CASCADE', onUpdate: 'CASCADE'})

export default OTPStore;
