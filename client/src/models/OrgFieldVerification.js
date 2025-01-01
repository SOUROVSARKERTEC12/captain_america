import {DataTypes} from 'sequelize';
import sequelize from '../config/database.config.js';
import {TempOrganization} from './tempOrganization.js';

export const OrgFieldVerification = sequelize.define('OrgFieldVerification', {
    id: {
        type: DataTypes.STRING(100),
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    fields: {
        type: DataTypes.ENUM("orgName", "address", "city", "country", "tin", "industry", "establishYear"), // Field name being verified
        allowNull: false
    },
    value: {
        type: DataTypes.STRING, // Value of the field being verified
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'), // Verification status
        defaultValue: 'pending',
        allowNull: false
    }
}, {
    tableName: 'OrgFieldVerification', // Explicit table name
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

OrgFieldVerification.belongsTo(TempOrganization, {
    foreignKey: "tempOrganizationId",
    as: "organizationId",
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
});
TempOrganization.hasMany(OrgFieldVerification, {
    foreignKey: "tempOrganizationId",
    as: "orgVerificationFields",
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

