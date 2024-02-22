const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const Comment = require("../models/Comment");
const BlogPost = require("../models/BlogPost");
const User = require("../models/User");

// GET ALL POST COMMENTS

exports.comments_get = asyncHandler(async (req, res, next) => {
  const allPostComments = await BlogPost.findById(
    req.params.postID,
    "comments"
  ).exec();

  if (!allPostComments) {
    res.status(404).json({ message: "Error: No post comments found." });
    return;
  }

  res.status(200).json({ allPostComments });
});

// CREATE COMMENT

exports.comment_create = [
  body("comment", "Comment cannot be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

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
      const newComment = new Comment({
        comment: req.body.comment,
        user: payload.user._id,
        post: req.params.postID,
      });

      await newComment.save();
      await BlogPost.findByIdAndUpdate(req.params.postID, {
        $push: { comments: newComment._id },
      });
      await User.findByIdAndUpdate(payload.user._id, {
        $push: { comments: newComment._id },
      });
      res.status(200).json({ newComment });
    });
  }),
];

// DELETE COMMENT

exports.comment_delete = asyncHandler(async (req, res, next) => {
  jwt.verify(req.token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) {
      res.status(403).json({ message: "Error: Token invalid." });
      return;
    }
    const deleteComment = await Comment.findByIdAndDelete(req.params.commentID);

    if (!deleteComment) {
      res.status(404).json({ message: "Error: Comment not found." });
      return;
    }

    res.status(200).json({ message: "Comment successfully deleted" });
  });
});
