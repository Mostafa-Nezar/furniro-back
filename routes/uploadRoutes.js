const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// إعداد التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // مجلد الصور
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, avatarUrl: fileUrl });
});

module.exports = router;
