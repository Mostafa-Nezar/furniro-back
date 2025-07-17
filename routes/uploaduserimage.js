const express = require('express');
const multer = require('multer');
const { cloudinary, storage } = require('../config/cloudinary');
const User = require('../models/user');
const router = express.Router();

const upload = multer({ storage }); // هنا بنستخدم تخزين Cloudinary

// رفع صورة جديدة
router.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // الرابط الجاهز من Cloudinary
  const fileUrl = req.file.path; // Cloudinary بيرجع URL في req.file.path
  res.json({ success: true, avatarUrl: fileUrl });
});

// تحديث صورة المستخدم
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

    const imageUrl = req.file.path; // رابط Cloudinary
    user.image = imageUrl;
    await user.save();

    res.json({
      success: true,
      message: 'User image updated successfully',
      imageUrl,
      user
    });
  } catch (error) {
    console.error('Error updating user image:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
