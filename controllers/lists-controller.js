const fs = require("fs");

const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const List = require("../models/list");
const User = require("../models/user");

const getListsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithLists;
  try {
    userWithLists = await User.findById(userId).populate("lists");
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!userWithLists || userWithLists.length === 0) {
    const error = new HttpError(
      "Could not find lists for the provided user id",
      404
    );
    return next(error);
  }

  res.json({
    lists: userWithLists.lists.map((list) =>
    list.toObject({ getters: true })
    ),
  });
};

const getListById = async (req, res, next) => {
  const listId = req.params.lid;

  let list;
  try {
    list = await List.findById(listId);
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!list) {
    const error = new HttpError(
      "Could not find a list for the provided id",
      404
    );
    return next(error);
  }

  res.json({ list: list.toObject({ getters: true }) });
};

const postCreateList = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdList = new List({
    title: title,
    description: description,
    address: address,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Creating list failed, please try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await createdList.save({ session: sess });
    user.lists.push(createdList);
    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating list failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ list: createdList });
};

const patchUpdateList = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid inputs passed, please check your data",
      422
    );
    return next(error);
  }

  const { title, description } = req.body;
  const listId = req.params.lid;

  let list;
  try {
    list = await List.findById(listId);
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!list) {
    const error = new HttpError(
      "Could not find a list for the provided id",
      404
    );
    return next(error);
  }

  if (list.creator.toString() !== req.userData.userId) {
    const error = new HttpError("Not authorized", 401);
    return next(error);
  }

  list.title = title;
  list.description = description;

  try {
    await list.save();
  } catch (err) {
    const error = new HttpError("Creating list failed, please try again", 500);
    return next(error);
  }

  res.status(200).json({ list: list.toObject({ getters: true }) });
};

const deleteList = async (req, res, next) => {
  const listId = req.params.lid;

  let list;
  try {
    list = await List.findById(listId).populate("creator");
  } catch (err) {
    const error = new HttpError("Deleting list failed, please try again", 500);
    return next(error);
  }

  if (!list) {
    const error = new HttpError("Cound not find list for this id", 404);
    return next(error);
  }

  if (list.creator.id !== req.userData.userId) {
    const error = new HttpError("Not authorized", 401);
    return next(error);
  }

  const imagePath = list.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await list.remove({ session: sess });
    list.creator.lists.pull(list);
    await list.creator.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Deleting list failed, please try again", 500);
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted list" });
};

exports.getListsByUserId = getListsByUserId;
exports.getListById = getListById;
exports.postCreateList = postCreateList;
exports.patchUpdateList = patchUpdateList;
exports.deleteList = deleteList;
