import {DataTypes} from 'sequelize';
import sequelize from '../../config/database.config.js';
import {TempUser} from '../tempUser.js';

export const Pages = sequelize.define('Pages', {
    id: {
        type: DataTypes.STRING(100),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    page1: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    page2: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    page3: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    page4: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    page5: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    page6: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
});

Pages.belongsTo(TempUser, {foreignKey: 'tempUserId', as: 'tempUser', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
TempUser.hasMany(Pages, {foreignKey: 'tempUserId', as: 'pageUser', onDelete:'CASCADE', onUpdate:'CASCADE'})

