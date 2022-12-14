const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const listsRoutes = require("./routes/lists-routes");
const usersRoutes = require("./routes/users-routes");
const videosRoutes = require("./routes/videos-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.options("/*", (_, res) => {
  res.sendStatus(200);
});

app.use("/api/lists", listsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/videos", videosRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }

  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error occurered" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@winkingcattabletop.hp3zr.mongodb.net/${process.env.DB_NAME}`
  )
  .then(() => {
    app.listen(process.env.PORT || 5000);
    console.log("Starting backend server");
  })
  .catch((err) => {
    console.log(err);
  });
