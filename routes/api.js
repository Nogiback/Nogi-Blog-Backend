const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");
const verifyToken = require("../middlewares/verifyToken");

// Authentication Routes
router.post("/register", authController.register_post);
router.post("/login", authController.login_post);
router.post("/logout", authController.logout_post);

// Blog Post Routes
router.get("/posts", postController.posts_get);
router.post("/posts", verifyToken, postController.post_create);
router.get("/posts/:postID", postController.postDetails_get);
router.put("/posts/:postID", verifyToken, postController.post_update);
router.delete("/posts/:postID", verifyToken, postController.post_delete);

// Comment Routes
router.get("/posts/:postID/comments", commentController.comments_get);
router.post(
  "/posts/:postID/comments",
  verifyToken,
  commentController.comment_create
);
router.delete(
  "/posts/:postID/comments/:commentID",
  verifyToken,
  commentController.comment_delete
);

module.exports = router;
