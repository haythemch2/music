const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middleware/requireLogin");
const Post = mongoose.model("post");
const Image = mongoose.model("image");

const { check, validationResult } = require("express-validator");

// add a post
// post
//http://localhost:5000/createpost

router.post("/createpost", requireLogin, (req, res) => {
  const { title, body, url } = req.body;
  if (!title || !body || !url) {
    res.status(422).json({ error: "please add all the fields" });
  }
  req.user.password = undefined;
  const post = new Post({
    title,
    body,
    url,
    postedBy: req.user,
  });
  post
    .save()
    .then((result) => {
      res.json({ post: result });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/uploadImage", requireLogin, (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(422).json({ error: "please add all the fields" });
  }
  req.user.password = undefined;
  const image = new Image({
    url,
    postedBy: req.user,
  });
  image
    .save()
    .then((result) => {
      res.json({ image: result });
    })
    .catch((err) => {
      console.log(err);
    });
});

//@Method PUT
//@desc update one post by id
//@Path: http://localhost:6000/posts/update/:id
//@Params id Body
router.put("/update/:id", async (req, res) => {
  try {
    const result = await Post.updateOne(
      { _id: req.params.id },
      { $set: { ...req.body } }
    );
    result.nModified
      ? res.send({ message: "Post updated" })
      : res.send({ message: "Post already updated" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "there is no post with this id" });
  }
});

//@Method DELETE
//@des delete one post by id
//@Path: http://localhost:6000/posts/delete/:id
//@Params id
router.delete("/delete/:id", async (req, res) => {
  try {
    const result = await Post.deleteOne({ _id: req.params.id });
    result.n
      ? res.send({ reponse: "post deleted" })
      : res.send("There is no post with this id");
  } catch (error) {
    res.send("Not deleted");
    console.log(error);
  }
});

router.delete("/deleteImage/:id", async (req, res) => {
  try {
    const result = await Image.deleteOne({ _id: req.params.id });
    result.n
      ? res.send({ reponse: "post deleted" })
      : res.send("There is no post with this id");
  } catch (error) {
    res.send("Not deleted");
    console.log(error);
  }
});

//@Method GET
//@des GET one post
//@Path: http://localhost:6000/posts/post/:id
//@Params id

router.get("/post/:id", async (req, res) => {
  try {
    const result = await Post.findOne({ _id: req.params.id })
      .populate("postedBy", "_id name url")
      .populate("comments.user", "_id name url");
    res.send({ response: result, message: "Getting post successfully " });
  } catch (error) {
    res.status(400).send({ message: "There is no post with this id" });
  }
});

// get all posts
//get
// http://localhost:5000/allpost

router.get("/allpost", requireLogin, (req, res) => {
  Post.find()
    .populate("postedBy", "_id name url")
    .populate("comments.user", "_id name url")
    .then((posts) => {
      res.json({ posts });
    })
    .catch((err) => {
      console.log(err);
    });
});

// get posts by user
// get
// http://localhost:5000/mypost
router.get("/mypost", requireLogin, (req, res) => {
  console.log(req.user);
  Post.find({ postedBy: req.user._id })
    .populate("postedBy", "_id name url")
    .populate("comments.user", "_id name url")
    .then((myposts) => {
      res.json({ myposts });
    })
    .catch((err) => {
      console.log(err);
    });
});

router.get("/myImages", requireLogin, (req, res) => {
  console.log(req.user);
  Image.find({ postedBy: req.user._id })
    .populate("postedBy", "_id name url")
    .then((myImages) => {
      res.json({ myImages });
    })
    .catch((err) => {
      console.log(err);
    });
});

//like posts
//put
//http://localhost:5000/like/id

router.put("/like/:id", requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ error: "Post already liked" });
    }

    post.likes.unshift({ user: req.user._id });
    await post.save();
    res.json(post.likes);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

//unlike posts
//put
//http://localhost:5000/unlike/id

router.put("/unlike/:id", requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ error: "Post has not been liked yet " });
    }

    const removeindex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeindex, 1);
    await post.save();
    res.status(200).json(post.likes);
  } catch (error) {
    res.json(error);
  }
});

//comment posts
//put
//http://localhost:5000/comment/post id

router.post(
  "/comment/:id",
  [requireLogin, [check("text", "Text is Required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = await Post.findById(req.params.id)
        .populate("comments.user", "_id name url")
        .populate("postedBy", "_id name url");
      req.user.password = undefined;
      const newComment = {
        text: req.body.text,
        user: req.user,
      };
      post.comments.unshift(newComment);
      await post.save();
      res.status(200).json(post.comments);
    } catch (error) {
      res.status(500).send("Server Error");
    }
  }
);

//delete comment posts
//put
//http://localhost:5000/comment/post id / comment id

router.delete("/comment/:id/:comment_id", requireLogin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    if (!comment) {
      return res.status(404).json({ msg: "comment does not exist" });
    }
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "user not authorized" });
    }

    const removeindex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeindex, 1);
    await post.save();
    res.json(post.comments);
  } catch (error) {
    res.status(500).send({ error: error });
  }
});

module.exports = router;
