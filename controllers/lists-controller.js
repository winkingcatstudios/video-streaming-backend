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
      ? await List.find({}).sort({ _id: -1 }).limit(10)
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

const getRandomLists = async (req, res, next) => {
  const typeQuery = req.query.type;
  const genreQuery = req.query.genre;
  let lists;
  try {
    if (typeQuery) {
      if (genreQuery) {
        // type and genre = type page and genre dropdown selected
        lists = await List.aggregate([
          { $sample: { size: 10 } },
          { $match: { type: typeQuery, genre: genreQuery } },
        ]);
      } else {
        // type but no genre = type page but no genre dropdown selected
        lists = await List.aggregate([
          { $sample: { size: 10 } },
          { $match: { type: typeQuery } },
        ]);
      }
    } else {
      // no type or genre = home page
      lists = await List.aggregate([{ $sample: { size: 10 } }]);
    }
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!lists || lists.length === 0) {
    const error = new HttpError("Could not find lists", 404);
    return next(error);
  }

  res.json({ lists: lists });
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
exports.getRandomLists = getRandomLists;
exports.getListById = getListById;
// exports.getRandomList = getRandomList;
exports.postCreateList = postCreateList;
exports.patchUpdateList = patchUpdateList;
exports.deleteList = deleteList;
