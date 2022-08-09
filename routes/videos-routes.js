const express = require("express");
const { check } = require("express-validator");

const videosController = require("../controllers/videos-controller");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

// public routes
router.get("/user/:uid", videosController.getVideosByUserId);

router.get("/:pid", videosController.getVideoById);

router.use(checkAuth);
// routes below this point require authentication

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }, { max: 500 }),
    check("address").not().isEmpty(),
  ],
  videosController.postCreateVideo
);

router.patch(
  "/:pid",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }, { max: 500 }),
  ],
  videosController.patchUpdateVideo
);

router.delete("/:pid", videosController.deleteVideo);

module.exports = router;
