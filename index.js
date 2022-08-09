const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const app = express();

dotenv.config();

process.env.MONGO_URI

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(5000);
    console.log("Backend server is running")
  })
  .catch((err) => {
    console.log(err);
  });
