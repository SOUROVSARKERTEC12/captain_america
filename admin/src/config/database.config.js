import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// First database connection
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
    }
);

// Second database connection
const sequelize1 = new Sequelize(
    process.env.DB_NAME_1,
    process.env.DB_USER_1,
    process.env.DB_PASSWORD_1,
    {
        host: process.env.DB_HOST_1,
        dialect: 'mysql',
        logging: false,
    }
);

export { sequelize, sequelize1 };
