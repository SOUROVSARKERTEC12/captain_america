import {DataTypes} from 'sequelize';
import sequelize from '../config/database.config.js';
import {TempUser} from './TempUser.js';

export const UserFieldVerification = sequelize.define('UserFieldVerification', {
    id: {
        type: DataTypes.STRING(100),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    fields: {
        type: DataTypes.ENUM("email", "firstName", "lastName", "nidFront", "nidBack",
            "phone", "role"),
        allowNull: false
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
    }
}, {
    tableName: 'UserFieldVerification',
    timestamps: true
});


UserFieldVerification.belongsTo(TempUser, {
    foreignKey: 'tempUserId', as: 'userId',
    onDelete: 'CASCADE', onUpdate: 'CASCADE'
});

TempUser.hasMany(UserFieldVerification, {
    foreignKey: 'tempUserId', as: 'UserFieldVerifications',
    onDelete: 'CASCADE', onUpdate: 'CASCADE'
})

