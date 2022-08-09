const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const listSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
    },
    genre: {
      type: String,
      required: true,
    },
    content: {
      type: Array,
    },
  },
  { timestamps: true }
);

listSchema.plugin(uniqueValidator);

module.exports = mongoose.model("List", listSchema);
