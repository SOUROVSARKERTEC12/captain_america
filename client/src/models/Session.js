import { DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';
import {TempUser} from "./tempUser.js";

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.STRING(100),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    logoutAt:{
        type: DataTypes.DATE,
        allowNull: true,
    }
});

Session.belongsTo(TempUser,{foreignKey:"tempUserId", as: "Id", onDelete:'CASCADE', onUpdate:'CASCADE'});

export default Session;
