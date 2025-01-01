import { DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';
import {Organization} from "./Organization.js";

export const Stakeholder = sequelize.define('Stakeholder', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
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
        allowNull: false
    },
    nidFront: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nidBack: {
        type: DataTypes.STRING,
        allowNull: true
    },
    stakeholderImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    }
}, {
    tableName: 'stakeholders',
    timestamps: false
});

Stakeholder.belongsTo(Organization, { foreignKey: "orgId", as:'organization',onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Organization.hasMany(Stakeholder, { foreignKey: "orgId", as:'stakeholders',onDelete: 'CASCADE', onUpdate: 'CASCADE' });



