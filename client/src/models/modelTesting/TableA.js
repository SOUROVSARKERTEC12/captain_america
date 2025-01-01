import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.config.js';
import TableB from './TableB.js';

const TableA = sequelize.define(
    'TableA',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        data: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tableBId: {
            type: DataTypes.INTEGER,
            references: {
                model: TableB,
                key: 'id',
            },
        },
    },
    {
        tableName: 'TableA',
        timestamps: false,
    }
);

// Define associations with CASCADE options
TableA.belongsTo(TableB, {
    foreignKey: 'tableBId',
    as: 'tableB',
    // onDelete: 'CASCADE',
    // onUpdate: 'CASCADE',
});

TableB.hasMany(TableA, {
    foreignKey: 'tableBId',
    as: 'tableAs',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
});

export default TableA;
