const express = require("express");
const { check } = require("express-validator");

const videosController = require("../controllers/videos-controller");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");
const checkAdmin = require("../middleware/check-admin");

const router = express.Router();

// public routes

router.use(checkAuth);
// routes below this point require authentication

router.get("/", videosController.getVideos);

router.get("/find/:vid", videosController.getVideoById);

router.get("/random", videosController.getRandomVideo);

router.use(checkAdmin);
// routes below this point require admin authentication

router.post(
  "/",
  // fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }, { max: 500 }),
    check("year").not().isEmpty(),
    check("ageLimit").not().isEmpty(),
    check("genre").not().isEmpty(),
    check("isSeries").not().isEmpty(),
  ],
  videosController.postCreateVideo
);

router.patch(
  "/:vid",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }, { max: 500 }),
    check("year").not().isEmpty(),
    check("ageLimit").not().isEmpty(),
    check("genre").not().isEmpty(),
    check("isSeries").not().isEmpty(),
  ],
  videosController.patchUpdateVideo
);

router.delete("/:vid", videosController.deleteVideo);

module.exports = router;
