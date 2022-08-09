const fs = require("fs");

const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const List = require("../models/list");

const getLists = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }

  const query = req.query.new;
  let lists;
  try {
    lists = query
      ? await List.find({}).sort({ _id: -1 }).limit(1)
      : await List.find({});
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!lists || lists.length === 0) {
    const error = new HttpError("Could not find lists", 404);
    return next(error);
  }

  res.json({
    lists: lists.map((list) => list.toObject({ getters: true })),
  });
};

const getListById = async (req, res, next) => {
  const ListId = req.params.lid;

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

const getRandomList = async (req, res, next) => {
  const type = req.query.type;

  let list;
  try {
    if (type === "series") {
      list = await List.aggregate([
        { $match: { isSeries: true } },
        { $sample: { size: 1 } },
      ]);
    } else {
      list = await List.aggregate([
        { $match: { isSeries: false } },
        { $sample: { size: 1 } },
      ]);
    }
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

  res.json({ list: list });
};

const postCreateList = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }

  const { title, type, genre, content } = req.body;

  const createdList = new List({
    title: title,
    type: type,
    genre: genre,
    content: content,
  });

  try {
    await createdList.save();
  } catch (err) {
    const error = new HttpError("Creating list failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ list: createdList });
};

const patchUpdateList = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid inputs passed, please check your data",
      422
    );
    return next(error);
  }

  const { title, type, genre } = req.body;
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

  list.title = title;
  list.type = type;
  list.genre = genre;

  try {
    await list.save();
  } catch (err) {
    const error = new HttpError("Creating list failed, please try again", 500);
    return next(error);
  }

  res.status(200).json({ list: list.toObject({ getters: true }) });
};

const deleteList = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }
  
  const listId = req.params.lid;

  let list;
  try {
    list = await List.findById(listId);
  } catch (err) {
    const error = new HttpError("Deleting list failed, please try again", 500);
    return next(error);
  }

  if (!list) {
    const error = new HttpError("Cound not find list for this id", 404);
    return next(error);
  }

  try {
    await list.remove();
  } catch (err) {
    const error = new HttpError("Deleting list failed, please try again", 500);
    return next(error);
  }

  res.status(200).json({ message: "Deleted list" });
};

exports.getLists = getLists;
exports.getListById = getListById;
exports.getRandomList = getRandomList;
exports.postCreateList = postCreateList;
exports.patchUpdateList = patchUpdateList;
exports.deleteList = deleteList;
