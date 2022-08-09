const express = require("express");
const { check } = require("express-validator");

const listsController = require("../controllers/lists-controller");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

// public routes
router.get("/user/:uid", listsController.getPlacesByUserId);

router.get("/:pid", listsController.getPlaceById);

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
  listsController.postCreatePlace
);

router.patch(
  "/:pid",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }, { max: 500 }),
  ],
  listsController.patchUpdatePlace
);

router.delete("/:pid", listsController.deletePlace);

module.exports = router;
