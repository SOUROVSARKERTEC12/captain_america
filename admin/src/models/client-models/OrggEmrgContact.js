import { DataTypes } from 'sequelize';
import {sequelize1} from "../../config/database.config.js";
import {Organization} from "./Organization.js";

export const OrgEmrgContact = sequelize1.define('OrgEmrgContact', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    whatsapp: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending'
    }
}, {
    timestamps: true,
    tableName: 'OrgEmrgContacts'
});

OrgEmrgContact.belongsTo(Organization, {foreignKey: 'orgId', as: 'Id', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
Organization.hasMany(OrgEmrgContact, {foreignKey: 'orgId', as: 'emergencyContact', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
