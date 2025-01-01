import {DataTypes} from 'sequelize';
import sequelize from '../config/database.config.js';
import TempStakeHolder from './tempStakeholder.js';

export const StakeholderFieldVerification = sequelize.define('StakeholderFieldVerification', {
    id: {
        type: DataTypes.STRING(100),
        defaultValue: DataTypes.UUIDV4, // Primary key
        primaryKey: true,
    },
    fields: {
        type: DataTypes.ENUM("username", "email", "firstName",
            "lastName", "phone", "nidFront", "nidBack", "stakeholderImage"), // Field name being verified
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
    tableName: 'stakeholderFieldVerification', // Explicit table name
    timestamps: true
});


StakeholderFieldVerification.belongsTo(TempStakeHolder, {
    foreignKey: "stakeholderId",
    as: "stakeholder",
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
});

TempStakeHolder.hasMany(StakeholderFieldVerification, {
    foreignKey: 'stakeholderId',
    as: 'fieldVerification',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})

