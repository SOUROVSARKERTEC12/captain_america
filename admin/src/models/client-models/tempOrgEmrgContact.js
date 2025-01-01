import {DataTypes} from 'sequelize';
import {sequelize1} from "../../config/database.config.js";
import {TempOrganization} from './tempOrganization.js';

const TempOrgEmrgContact = sequelize1.define('TempOrgEmrgContact', {
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
    tableName: 'tempOrgEmrgContacts'
});


TempOrgEmrgContact.belongsTo(TempOrganization, {foreignKey: 'orgId', as: 'Id', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
TempOrganization.hasMany(TempOrgEmrgContact, {foreignKey: 'orgId', as: 'emergencyContact', onDelete: 'CASCADE', onUpdate: 'CASCADE'});

export default TempOrgEmrgContact;
