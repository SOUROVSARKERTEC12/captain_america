import { DataTypes } from 'sequelize';
import {sequelize1} from "../../config/database.config.js";
import {TempOrganization} from "./tempOrganization.js";

const Tempstakeholder = sequelize1.define('Tempstakeholder', {
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
        type: DataTypes.STRING, // Path or URL to the front side of NID picture
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
    timestamps: false,
    tableName: 'tempstakeholders'
});

Tempstakeholder.belongsTo(TempOrganization, { foreignKey: "orgId", as:'Id',onDelete: 'CASCADE', onUpdate: 'CASCADE' });
TempOrganization.hasMany(Tempstakeholder, { foreignKey: "orgId", as:'stakeholder',onDelete: 'CASCADE', onUpdate: 'CASCADE' });

export default Tempstakeholder;
