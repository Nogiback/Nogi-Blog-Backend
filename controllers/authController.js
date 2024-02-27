const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// REGISTRATION

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

    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      if (err) {
        res.status(500).json({ err });
        return;
      } else {
        const newUser = new User({
          username: req.body.username,
          password: hashedPassword,
        });
        await newUser.save();
        res.status(200).json({ message: "New user created successfully." });
      }
    });

    // const payloadUser = {
    //   id: newUser._id,
    //   username: newUser.username,
    //   isAuthor: newUser.author,
    // };

    // jwt.sign(
    //   { user: payloadUser },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "1d" },
    //   (err, token) => {
    //     if (err) {
    //       res.status(500).json({ err });
    //       return;
    //     }
    //     res.status(200).json({
    //       token: token,
    //       user: payloadUser,
    //       message: "New user created successfully.",
    //     });
    //     return;
    //   }
    // );
  }),
];

// LOGIN

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

// LOGOUT
exports.logout_post = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.status(200).json({ message: "User successfully logged out." });
  });
};
