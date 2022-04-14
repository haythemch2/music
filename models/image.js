const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const Schema = mongoose.Schema;
const postSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  postedBy: {
    type: ObjectId,
    ref: "client",
  },
});

mongoose.model("image", postSchema);
