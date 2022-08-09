const express = require("express");
const { check } = require("express-validator");

const listsController = require("../controllers/lists-controller");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

// public routes
router.get("/user/:uid", listsController.getListsByUserId);

router.get("/:lid", listsController.getListById);

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
  listsController.postCreateList
);

router.patch(
  "/:lid",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }, { max: 500 }),
  ],
  listsController.patchUpdateList
);

router.delete("/:lid", listsController.deleteList);

module.exports = router;
