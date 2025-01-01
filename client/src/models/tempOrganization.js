import { DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';
import { TempUser } from './TempUser.js';

export const TempOrganization = sequelize.define('TempOrg1', {
    id: {
        type: DataTypes.STRING(100),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    orgName: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    country: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    tin: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
    },
    industry: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    establishYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending',
        allowNull: true,
    },
}, {
    tableName: 'temporgs',
    timestamps: true,
});

// Define associations
TempOrganization.belongsTo(TempUser, {
    foreignKey: 'tempUserId',
    as: 'organizationOwner',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

TempUser.hasOne(TempOrganization, {
    foreignKey: 'tempUserId',
    as: 'OwnerOrganization',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});
