const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");
const getJWTPrivateKey = require("../dev-files/dev-files").getJWTPrivateKey;

const getUsers = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }

  const query = req.query.new;
  let users;
  try {
    users = query
      ? await User.find({}, "-password").sort({ _id: -1 }).limit(5)
      : await User.find({}, "-password");
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

const getUserById = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }

  let user;
  try {
    user = await User.findById(req.params.id, "-password");
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user", 404);
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};

const getUserStats = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }

  // Could aggregate for past year only, leaving as option for now
  // const today = new Date();
  // const lastYear = today.setFullYear(today.setFullYear() - 1);

  let userStats;
  try {
    userStats = await User.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!userStats) {
    const error = new HttpError("Could not find users", 404);
    return next(error);
  }

  res.json(userStats);
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
    // image: req.file.path,
    password: hashedPassword,
    // lists: [],
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
      { userId: createdUser.id, email: createdUser.email, isAdmin: false },
      getJWTPrivateKey(),
      {
        expiresIn: "1d",
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
      {
        userId: existingUser.id,
        email: existingUser.email,
        isAdmin: existingUser.isAdmin,
      },
      getJWTPrivateKey(),
      {
        expiresIn: "1d",
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

const putUpdateUser = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }

  res.json({
    message: "Update allowed",
  });
};

const deleteUser = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }

  res.json({
    message: "Delete allowed",
  });
};

exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getUserStats = getUserStats;
exports.postSignup = postSignup;
exports.postLogin = postLogin;
exports.putUpdateUser = putUpdateUser;
exports.deleteUser = deleteUser;
