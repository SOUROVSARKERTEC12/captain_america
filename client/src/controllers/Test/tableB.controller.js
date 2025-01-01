import TableB from "../../models/modelTesting/TableB.js";
import TableA from "../../models/modelTesting/TableA.js";

export const createTableB = async (req, res) => {
    try {
        const { name } = req.body; // Extract data from request body
        const newRecord = await TableB.create({ name });
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating record', error });
    }
};

// Read all records in TableB
export const getAllTableB = async (req, res) => {
    try {
        const records = await TableB.findAll({
            include: { model: TableA, as: 'tableAs' }, // Include associated TableA records
        });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching records', error });
    }
};

// Read a single record by ID
export const getTableBById = async (req, res) => {
    try {
        const { id } = req.params; // Extract ID from URL parameters
        const record = await TableB.findOne({
            where: { id },
            include: { model: TableA, as: 'tableAs' }, // Include associated TableA records
        });
        if (record) {
            res.status(200).json(record);
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching record', error });
    }
};

// Update a record by ID
export const updateTableB = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const updated = await TableB.update({ name }, { where: { id } });
        if (updated[0] > 0) {
            res.status(200).json({ message: 'Record updated successfully' });
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating record', error });
    }
};

// Delete a record by ID
export const deleteTableB = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await TableB.destroy({ where: { id } });
        if (deleted) {
            res.status(200).json({ message: 'Record deleted successfully' });
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting record', error });
    }
};

