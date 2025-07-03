const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/user');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
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

  const fileUrl = `http://localhost:3001/uploads/${req.file.filename}`;
  res.json({ success: true, avatarUrl: fileUrl });
});

router.patch('/:id/update-image', upload.single('avatar'), async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    
    user.image = imageUrl;
    await user.save();

    res.json({ 
      success: true, 
      message: 'User image updated successfully',
      imageUrl: imageUrl,
      user: user
    });
  } catch (error) {
    console.error('Error updating user image:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
