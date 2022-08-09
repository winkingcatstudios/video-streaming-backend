const express = require("express");
const { check } = require("express-validator");

const placesController = require("../controllers/places-controller");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

// public routes
router.get("/user/:uid", placesController.getPlacesByUserId);

router.get("/:pid", placesController.getPlaceById);

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
  placesController.postCreatePlace
);

router.patch(
  "/:pid",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }, { max: 500 }),
  ],
  placesController.patchUpdatePlace
);

router.delete("/:pid", placesController.deletePlace);

module.exports = router;
