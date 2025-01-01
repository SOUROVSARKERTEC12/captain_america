import express from "express";
import {
    createTableA,
    deleteTableA,
    getAllTableA,
    getTableAById,
    updateTableA
} from "../../controllers/Test/tableA.controller.js";

const router = express.Router();

// Routes for CRUD operations
router.post('/tableA', createTableA); // Create
router.get('/tableA', getAllTableA); // Read All
router.get('/tableA/:id', getTableAById); // Read One
router.put('/tableA/:id', updateTableA); // Update
router.delete('/tableA/:id', deleteTableA); // Delete

export default router;
