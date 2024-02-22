const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const BlogPost = require("../models/BlogPost");

exports.posts_get = asyncHandler(async (req, res, next) => {
  const allPosts = await BlogPost.find()
    .sort({ timestamp: -1 })
    .populate("author", "username")
    .exec();

  if (!allPosts) {
    res.status(404).json({ message: "Error: No posts found." });
    return;
  }

  res.status(200).json({ allPosts });
});

exports.posts_create = [
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("content", "Content must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("image").trim().optional(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(401).json({ errors: errors.array() });
      return;
    }

    jwt.verify(req.token, process.env.JWT_SECRET, async (err, payload) => {
      if (payload.user.isAuthor) {
        if (err) {
          res.status(403).json({ message: "Error: Token invalid." });
          return;
        }
        const newPost = new BlogPost({
          title: req.body.title,
          content: req.body.content,
          image: req.body.image,
          author: payload.user._id,
        });

        await newPost.save();
        res.status(200).json({ newPost });
      } else {
        res
          .status(403)
          .json({ message: "Error: Unauthorized author.", payload });
      }
    });
  }),
];

exports.postDetails_get = asyncHandler(async (req, res, next) => {
  const post = await BlogPost.findById(req.params.postID)
    .populate("author", "username")
    .exec();

  if (!post) {
    res.status(404).json({ message: "Error: No post found." });
    return;
  }

  res.status(200).json({ post });
});

exports.postDetails_update = [
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("content", "Content must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("image").trim().optional(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(401).json({ errors: errors.array() });
      return;
    }

    jwt.verify(req.token, process.env.JWT_SECRET, async (err, payload) => {
      if (payload.user.isAuthor) {
        if (err) {
          res.status(403).json({ message: "Error: Token invalid." });
          return;
        }

        const updatedDetails = {
          title: req.body.title,
          content: req.body.content,
          image: req.body.image,
          author: payload.user._id,
          _id: req.params.postID,
        };

        const updatedPost = await BlogPost.findByIdAndUpdate(
          req.params.postID,
          updatedDetails,
          { new: true }
        );

        if (!updatedPost) {
          res.status(404).json({ message: "Error: Post not found." });
          return;
        }

        res.status(200).json({ updatedPost });
      } else {
        res
          .status(403)
          .json({ message: "Error: Unauthorized author.", payload });
      }
    });
  }),
];

exports.postDetails_delete = asyncHandler(async (req, res, next) => {
  jwt.verify(req.token, process.env.JWT_SECRET, async (err, payload) => {
    if (payload.user.isAuthor) {
      if (err) {
        res.status(403).json({ message: "Error: Token invalid." });
        return;
      }

      const deletePost = await BlogPost.findByIdAndDelete(req.params.postID);

      if (!deletePost) {
        res.status(404).json({ message: "Error: Post not found." });
        return;
      }

      res.status(200).json({ message: "Post successfully deleted" });
    } else {
      res.status(403).json({ message: "Error: Unauthorized author.", payload });
    }
  });
});
