const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const Comment = require("../models/Comment");
const BlogPost = require("../models/BlogPost");
const User = require("../models/User");

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

exports.comment_create = [];

// router.get("/posts/:postID/comments", commentController.comments_get);
// router.post(
//   "/posts/:postID/comments",
//   verifyToken,
//   commentController.comment_create
// );
// router.delete(
//   "/posts/:postID/comments/:commentID",
//   verifyToken,
//   commentController.comment_delete
// );
