const Post = require("../models/post");


exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ id: 1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts", error: err.message });
  }
};

exports.addPost = async (req, res) => {
  try {
    const { id, date, category, title, content } = req.body;
    const uploadedImage = req.file ? req.file.path : null;

    const newPost = new Post({
      id,
      image: uploadedImage,
      date: date ? new Date(date) : new Date(),
      category,
      title,
      content,
    });

    await newPost.save();
    res.status(201).json({ message: "✅ Post created successfully", post: newPost });
  } catch (err) {
    res.status(500).json({ message: "Error creating post", error: err.message });
  }
};
