const fs = require("fs");

const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Video = require("../models/video");
const User = require("../models/user");

// const getVideosByUserId = async (req, res, next) => {
//   const userId = req.params.uid;

//   let userWithVideos;
//   try {
//     userWithVideos = await User.findById(userId).populate("videos");
//   } catch (err) {
//     const error = new HttpError("Something went wrong, database error", 500);
//     return next(error);
//   }

//   if (!userWithVideos || userWithVideos.length === 0) {
//     const error = new HttpError(
//       "Could not find videos for the provided user id",
//       404
//     );
//     return next(error);
//   }

//   res.json({
//     videos: userWithvideos.videos.map((video) =>
//     video.toObject({ getters: true })
//     ),
//   });
// };

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

  const { title, description, year, ageLimit, genre, isSeries } = req.body;

  const createdVideo = new Video({
    title: title,
    description: description,
    year: year,
    ageLimit: ageLimit,
    genre: genre,
    isSeries: isSeries,
    // image: req.file.path,
    // creator: req.userData.userId,
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

  const { title, description, year, ageLimit, genre, isSeries } = req.body;
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

  if (video.creator.toString() !== req.userData.userId) {
    const error = new HttpError("Not authorized", 401);
    return next(error);
  }

  video.title = title;
  video.description = description;

  try {
    await video.save();
  } catch (err) {
    const error = new HttpError("Creating video failed, please try again", 500);
    return next(error);
  }

  res.status(200).json({ video: video.toObject({ getters: true }) });
};

const deleteVideo = async (req, res, next) => {
  const videoId = req.params.vid;

  let video;
  try {
    video = await Video.findById(videoId).populate("creator");
  } catch (err) {
    const error = new HttpError("Deleting video failed, please try again", 500);
    return next(error);
  }

  if (!video) {
    const error = new HttpError("Cound not find video for this id", 404);
    return next(error);
  }

  if (video.creator.id !== req.userData.userId) {
    const error = new HttpError("Not authorized", 401);
    return next(error);
  }

  const imagePath = video.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await video.remove({ session: sess });
    video.creator.videos.pull(video);
    await video.creator.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Deleting video failed, please try again", 500);
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted video" });
};

// exports.getVideosByUserId = getVideosByUserId;
exports.getVideoById = getVideoById;
exports.postCreateVideo = postCreateVideo;
exports.patchUpdateVideo = patchUpdateVideo;
exports.deleteVideo = deleteVideo;
