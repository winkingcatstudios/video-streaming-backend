const fs = require("fs");

const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Video = require("../models/video");

const getVideos = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }

  const query = req.query.new;
  let videos;
  try {
    videos = query
      ? await Video.find({}).sort({ _id: -1 }).limit(10)
      : await Video.find({});
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!videos || videos.length === 0) {
    const error = new HttpError("Could not find videos", 404);
    return next(error);
  }

  res.json({
    videos: videos.map((video) => video.toObject({ getters: true })),
  });
};

const getVideoById = async (req, res, next) => {
  const videoId = req.params.vid;

  let video;
  try {
    video = await Video.findById(videoId);
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!video) {
    const error = new HttpError(
      "Could not find a video for the provided id",
      404
    );
    return next(error);
  }

  res.json({ video: video.toObject({ getters: true }) });
};

const getRandomVideo = async (req, res, next) => {
  const type = req.query.type;

  let video;
  try {
    if (type === "oneshots") {
      video = await Video.aggregate([
        { $match: { type: "oneshots" } },
        { $sample: { size: 1 } },
      ]);
    } else if (type === "series") {
      video = await Video.aggregate([
        { $match: { type: "series" } },
        { $sample: { size: 1 } },
      ]);
    } else if (type === "cats") {
      video = await Video.aggregate([
        { $match: { type: "cats" } },
        { $sample: { size: 1 } },
      ]);
    } else {
      video = await Video.aggregate([
        { $sample: { size: 1 } },
      ]);
    }

    
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!video) {
    const error = new HttpError(
      "Could not find a video for the provided id",
      404
    );
    return next(error);
  }

  res.json({ video: video});
};

const postCreateVideo = async (req, res, next) => {
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

  const { title, description, image, imageTitle, imageThumb, trailerVideo, fullVideo, year, ageLimit, genre, type } = req.body;

  const createdVideo = new Video({
    title: title,
    description: description,
    image: image,
    imageTitle: imageTitle,
    imageThumb: imageThumb,
    trailerVideo: trailerVideo,
    fullVideo: fullVideo,
    year: year,
    ageLimit: ageLimit,
    genre: genre,
    type: type
  });

  try {
    await createdVideo.save();
  } catch (err) {
    const error = new HttpError("Creating video failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ video: createdVideo });
};

const patchUpdateVideo = async (req, res, next) => {
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

  const { title, description, image, imageTitle, imageThumb, trailerVideo, fullVideo, year, ageLimit, genre, type } = req.body;
  const videoId = req.params.vid;

  let video;
  try {
    video = await Video.findById(videoId);
  } catch (err) {
    const error = new HttpError("Something went wrong, database error", 500);
    return next(error);
  }

  if (!video) {
    const error = new HttpError(
      "Could not find a video for the provided id",
      404
    );
    return next(error);
  }

  video.title = title;
  video.description = description;
  video.image = image;
  video.imageTitle = imageTitle;
  video.imageThumb = imageThumb;
  video.trailerVideo = trailerVideo;
  video.fullVideo = fullVideo;
  video.year = year;
  video.ageLimit = ageLimit;
  video.genre = genre;
  video.type = type;

  try {
    await video.save();
  } catch (err) {
    const error = new HttpError("Creating video failed, please try again", 500);
    return next(error);
  }

  res.status(200).json({ video: video.toObject({ getters: true }) });
};

const deleteVideo = async (req, res, next) => {
  if (!req.userData.isAdmin) {
    const error = new HttpError("Admin required", 403);
    return next(error);
  }

  const videoId = req.params.vid;

  let video;
  try {
    video = await Video.findById(videoId);
  } catch (err) {
    const error = new HttpError("Deleting video failed, please try again", 500);
    return next(error);
  }

  if (!video) {
    const error = new HttpError("Cound not find video for this id", 404);
    return next(error);
  }

  // const imagePath = video.image;

  try {
    await video.remove();
  } catch (err) {
    const error = new HttpError("Deleting video failed, please try again", 500);
    return next(error);
  }

  // fs.unlink(imagePath, (err) => {
  //   console.log(err);
  // });

  res.status(200).json({ message: "Deleted video" });
};

exports.getVideos = getVideos;
exports.getVideoById = getVideoById;
exports.getRandomVideo = getRandomVideo;
exports.postCreateVideo = postCreateVideo;
exports.patchUpdateVideo = patchUpdateVideo;
exports.deleteVideo = deleteVideo;
