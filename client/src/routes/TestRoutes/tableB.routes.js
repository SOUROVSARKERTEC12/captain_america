import {
    createTableB,
    deleteTableB,
    getAllTableB,
    getTableBById,
    updateTableB
} from "../../controllers/Test/tableB.controller.js";
import express from "express";

const router = express.Router();
// Routes for CRUD operations
router.post('/tableB', createTableB); // Create
router.get('/tableB', getAllTableB); // Read All
router.get('/tableB/:id', getTableBById); // Read One
router.put('/tableB/:id', updateTableB); // Update
router.delete('/tableB/:id', deleteTableB); // Delete

export default router;
