import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import sequelize from './config/database.config.js';
import cookieParser from 'cookie-parser';
import {errorHandler} from "./middlewares/errorMiddleware.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());


const PORT = process.env.PORT || 6000;

sequelize.sync()
    .then(() => console.log('Database sync successfully'))
    .catch(err => console.log('Error updating user:', err));
// Start server
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected');
        app.listen(PORT, () => {
            console.log(`Client Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

// Routes
app.use('/api', routes);
app.use(errorHandler);



