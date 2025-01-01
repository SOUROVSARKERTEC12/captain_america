import { DataTypes } from "sequelize";
import sequelize from '../../config/database.config.js';


export const PageDependencies = sequelize.define('PageDependencies', {
    id: {
        type: DataTypes.UUID,
        defaultValue:DataTypes.UUIDV4,
        primaryKey: true,
    },
    dependentPage: {
        type: DataTypes.STRING,
        defaultValue:"page4"
    },
    prerequisitePage: {
        type: DataTypes.STRING,
        defaultValue:"page3"
    },
}, {
    tableName: 'page_dependencies',
    timestamps: false,
});


