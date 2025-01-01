import multer from 'multer';

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/'), // Set the upload directory
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`), // Set a unique filename
});

const uploads = multer({ storage });

export default uploads;
