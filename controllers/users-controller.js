const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");
const getJWTPrivateKey = require("../dev-files/dev-files").getJWTPrivateKey;

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!users || users.length === 0) {
    const error = new HttpError("Could not find users", 404);
    return next(error);
  }

  res.json({
    users: users.map((user) => user.toObject({ getters: true })),
  });
};

const postSignup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid inputs passed, please check your data",
      422
    );
    return next(error);
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("Signup unsuccessful", 422);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  const createdUser = new User({
    name: name,
    email: email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Signup unsuccessful", 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      getJWTPrivateKey(),
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("Signup unsuccessful", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const postLogin = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Login unsuccessful", 403);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError("Login unsuccessful", 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Login unsuccessful", 403);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      getJWTPrivateKey(),
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("Login unsuccessful", 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.postSignup = postSignup;
exports.postLogin = postLogin;
