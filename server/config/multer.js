import multer from "multer";
import { createMulterStorage } from "./storage.js";

const FIVE_GB = 5 * 1024 * 1024 * 1024;

let multerInstance;

async function getUpload() {
  if (!multerInstance) {
    const storage = await createMulterStorage(multer);
    multerInstance = multer({ storage, limits: { fileSize: FIVE_GB } });
  }
  return multerInstance;
}

// Export a middleware-like wrapper that resolves to the actual multer instance
const upload = {
  array: (fieldName, maxCount) => async (req, res, next) => {
    try {
      const m = await getUpload();
      return m.array(fieldName, maxCount)(req, res, next);
    } catch (err) {
      next(err);
    }
  },
};

export default upload;
