const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, 
  image: String,
  date: { type: Date, default: Date.now },
  category: String,
  title: String,
  content: String,
});

postSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastPost = await mongoose.model("Post").findOne().sort({ id: -1 });
    this.id = lastPost ? lastPost.id + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
