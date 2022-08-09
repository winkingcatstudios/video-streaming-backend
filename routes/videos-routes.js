const express = require("express");
const { check } = require("express-validator");

const videosController = require("../controllers/videos-controller");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

// public routes
router.get("/user/:uid", videosController.getPlacesByUserId);

router.get("/:pid", videosController.getPlaceById);

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
  videosController.postCreatePlace
);

router.patch(
  "/:pid",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }, { max: 500 }),
  ],
  videosController.patchUpdatePlace
);

router.delete("/:pid", videosController.deletePlace);

module.exports = router;
