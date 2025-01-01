import TableA from "../../models/modelTesting/TableA.js";
import TableB from "../../models/modelTesting/TableB.js";

export const createTableA = async (req, res) => {
    try {
        const { data, tableBId } = req.body; // Extract data from request body
        const newRecord = await TableA.create({ data, tableBId });
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error creating record', error });
    }
};

// Read all records in TableA
export const getAllTableA = async (req, res) => {
    try {
        const records = await TableA.findAll({
            include: { model: TableB, as: 'tableB' }, // Include associated TableB
        });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching records', error });
    }
};

// Read a single record by ID
export const getTableAById = async (req, res) => {
    try {
        const { id } = req.params; // Extract ID from URL parameters
        const record = await TableA.findOne({
            where: { id },
            include: { model: TableB, as: 'tableB' },
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
export const updateTableA = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, tableBId } = req.body;
        const updated = await TableA.update({ data, tableBId }, { where: { id } });
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
export const deleteTableA = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await TableA.destroy({ where: { id } });
        if (deleted) {
            res.status(200).json({ message: 'Record deleted successfully' });
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting record', error });
    }
};


