import multer from "multer";

// Set up multers for handling file uploads

const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;
