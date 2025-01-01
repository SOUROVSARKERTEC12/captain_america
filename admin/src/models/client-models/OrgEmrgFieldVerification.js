import {DataTypes} from 'sequelize';
import {sequelize1} from "../../config/database.config.js";
import TempOrgEmrgContact from './tempOrgEmrgContact.js';


export const OrgEmrgFieldVerification = sequelize1.define('OrgEmrgFieldVerification', {
    id: {
        type: DataTypes.STRING(100),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    fields: {
        type: DataTypes.ENUM('username', 'phone', 'whatsapp'),
        allowNull: true
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'), // Verification status
        defaultValue: 'pending',
        allowNull: false
    }
}, {
    tableName: 'OrgEmrgFieldVerification',
    timestamps: true
});


OrgEmrgFieldVerification.belongsTo(TempOrgEmrgContact, {
    foreignKey: 'tempOrgEmrgContactId',
    as: 'contact',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
});
TempOrgEmrgContact.hasMany(OrgEmrgFieldVerification, {
    foreignKey: 'tempOrgEmrgContactId',
    as: 'emrgContact',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
})
