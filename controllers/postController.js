const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const BlogPost = require("../models/BlogPost");
const Comment = require("../models/Comment");
const User = require("../models/User");

// GET ALL BLOG POSTS

exports.posts_get = asyncHandler(async (req, res, next) => {
  const allPosts = await BlogPost.find()
    .sort({ timestamp: -1 })
    .populate("author", "username")
    .exec();

  if (!allPosts) {
    res.status(404).json({ message: "Error: No posts found." });
    return;
  }

  res.status(200).json(allPosts);
});

// CREATE BLOG POST

exports.post_create = [
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
      if (err) {
        res.status(403).json({ message: "Error: Token invalid." });
        return;
      }

      if (payload.user.isAuthor) {
        const newPost = new BlogPost({
          title: req.body.title,
          content: req.body.content,
          image: req.body.image,
          author: payload.user._id,
        });

        await newPost.save();
        res.status(200).json(newPost);
      } else {
        res
          .status(403)
          .json({ message: "Error: Unauthorized author.", payload });
      }
    });
  }),
];

// GET SINGLE BLOG POST

exports.postDetails_get = asyncHandler(async (req, res, next) => {
  const post = await BlogPost.findById(req.params.postID)
    .populate("author", "username")
    .exec();

  if (!post) {
    res.status(404).json({ message: "Error: No post found." });
    return;
  }

  res.status(200).json(post);
});

// UPDATE SINGLE BLOG POST

exports.post_update = [
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
      if (err) {
        res.status(403).json({ message: "Error: Token invalid." });
        return;
      }
      if (payload.user.isAuthor) {
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

        res.status(200).json(updatedPost);
      } else {
        res
          .status(403)
          .json({ message: "Error: Unauthorized author.", payload });
      }
    });
  }),
];

// DELETE BLOG POST

exports.post_delete = asyncHandler(async (req, res, next) => {
  jwt.verify(req.token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) {
      res.status(403).json({ message: "Error: Token invalid." });
      return;
    }
    if (payload.user.isAuthor) {
      const postToDelete = await BlogPost.findById(req.params.postID);

      if (!postToDelete) {
        res.status(404).json({ message: "Error: Post not found." });
        return;
      }

      if (!postToDelete.comments.length) {
        await BlogPost.findByIdAndDelete(req.params.postID);
        res.status(200).json({ message: "Post successfully deleted" });
        return;
      } else {
        postToDelete.comments.forEach(async (comment) => {
          await User.findByIdAndUpdate(comment.user._id, {
            $pullAll: { comments: [comment] },
          });
          await Comment.findByIdAndDelete(comment._id);
          await BlogPost.findByIdAndDelete(req.params.postID);
        });
        res.status(200).json({ message: "Post successfully deleted" });
        return;
      }
    } else {
      res.status(403).json({ message: "Error: Unauthorized author." });
    }
  });
});
