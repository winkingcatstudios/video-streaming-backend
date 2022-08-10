const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    imageTitle: {
      type: String,
      required: true,
    },
    imageThumb: {
      type: String,
      required: true,
    },
    trailerVideo: {
      type: String,
      required: true,
    },
    fullVideo: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    ageLimit: {
      type: Number,
      required: true,
    },
    genre: {
      type: String,
      required: true,
    },
    isSeries: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Video", videoSchema);
