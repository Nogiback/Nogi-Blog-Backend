const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
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
      res.status(403).json({
        errors: errors.array(),
        message: "Error: Registration Failure.",
      });
      return;
    }

    if (duplicateUser) {
      res.status(403).json({
        message: "Error: Username already exists.",
      });
      return;
    }

    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
      if (err) {
        return next(err);
      }

      const user = new User({
        username: req.body.username,
        password: hashedPassword,
      });

      user.save();
      res.status(200).json({
        message: "User created successfully.",
      });
      return;
    });
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
    const loginUser = await User.findOne({ username: req.body.username });
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(403).json({
        errors: errors.array(),
        message: "Error: Login Failure.",
      });
      return;
    }

    passport.authenticate("local", { session: false }, (err, user) => {
      user = loginUser;
      if (err || !user) {
        return res.status(403).json({
          message: "Error: Incorrect username or password.",
        });
      }
      req.login(user, { session: false }, (err) => {
        const body = {
          _id: user._id,
          username: user.username,
          isAuthor: user.author,
        };
        jwt.sign(
          { user: body },
          process.env.JWT_SECRET,
          { expiresIn: "2h" },
          (err, token) => {
            if (err) {
              return res.status(400).json(err);
            }
            res.status(200).json({
              token: token,
              user: body,
              message: "Login successful.",
            });
          }
        );
      });
    })(req, res);
  }),
];

exports.auth_get = function (req, res, next) {
  jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
    if (err) {
      res.json({
        isAuthenticated: false,
      });
    }
    res.json({
      isAuthenticated: true,
      authData: authData,
    });
  });
};
