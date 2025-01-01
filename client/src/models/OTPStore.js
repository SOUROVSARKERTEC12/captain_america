import {DataTypes} from 'sequelize';
import sequelize from '../config/database.config.js';
import {TempUser} from "./tempUser.js";


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


OTPStore.belongsTo(TempUser, {foreignKey: 'tempUserId', as: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE'});

export default OTPStore;
