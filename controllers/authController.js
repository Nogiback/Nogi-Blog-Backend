const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.register_post = [
  body("username", "Username must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("password", "Password must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("confirmPassword", "Passwords must match.")
    .custom((value, { req }) => value === req.body.password)
    .escape(),

  asyncHandler(async (req, res, next) => {
    const duplicateUser = await User.findOne({ username: req.body.username });
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.array(),
        message: "Error: Registration Failure.",
      });
      return;
    }

    if (duplicateUser) {
      res.status(409).json({
        message: "Error: Username already exists.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      username: req.body.username,
      password: hashedPassword,
    });

    await newUser.save();

    const payloadUser = {
      id: newUser._id,
      username: newUser.username,
      isAuthor: newUser.author,
    };

    jwt.sign(
      { user: payloadUser },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
      (err, token) => {
        if (err) {
          res.status(500).json({ err });
          return;
        }
        res.status(200).json({
          token: token,
          user: payloadUser,
          message: "New user created successfully.",
        });
        return;
      }
    );
  }),
];

exports.login_post = [
  body("username", "Username must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("password", "Password must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(401).json({
        errors: errors.array(),
        message: "Error: Login Failure.",
      });
      return;
    }

    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      res.status(401).json({ message: "Error: Wrong username or password." });
      return;
    }

    const isValidPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!isValidPassword) {
      res.status(401).json({ message: "Error: Wrong username or password." });
      return;
    }

    const payloadUser = {
      _id: user._id,
      username: user.username,
      isAuthor: user.author,
    };
    jwt.sign(
      { user: payloadUser },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
      (err, token) => {
        if (err) {
          res.status(500).json({ err });
          return;
        }
        res.status(200).json({
          token: token,
          user: payloadUser,
          message: "Login successful.",
        });
        return;
      }
    );
  }),
];

exports.logout_get = function (req, res) {
  req.logout();
  res.redirect("/");
};

exports.auth_get = function (req, res, next) {
  jwt.verify(req.token, process.env.JWT_SECRET, async (err, payload) => {
    if (err) {
      res.json({
        isAuthenticated: false,
      });
    }
    res.json({
      isAuthenticated: true,
      payload,
    });
  });
};
