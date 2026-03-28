const multer = require('multer');

const ALLOWED_MIME_TYPES = {
     // Images
  'image/jpeg': true,
  'image/png':  true,
  'image/gif':  true,
  // Videos
  'video/mp4':  true,
  'video/webm': true,
  // Audio
  'audio/mpeg': true, // mp3
  'audio/wav':  true,
  'audio/ogg':  true,
  'audio/mp4':  true,
  'audio/webm': true,
  // Files
  'application/pdf': true,
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// multer config
const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: MAX_FILE_SIZE,
    },

    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES[file.mimetype]) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
        }
    }
});

// multer errro handler - catches multer-specific errors (file size, file type) before they reach controller
const uploadErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size exceeds the limit of 10MB' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Unsupported file type' });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
};

module.exports = { upload, uploadErrorHandler };
