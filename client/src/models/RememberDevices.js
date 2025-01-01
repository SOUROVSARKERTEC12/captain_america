import { DataTypes } from 'sequelize';
import sequelize from '../config/database.config.js';

const RememberedDevice = sequelize.define('RememberedDevice', {
    id:{
      type:DataTypes.STRING(100),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    deviceId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    expirationTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
});

export default RememberedDevice;
