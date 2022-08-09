const express = require("express");
const { check } = require("express-validator");

const listsController = require("../controllers/lists-controller");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");
const checkAdmin = require("../middleware/check-admin");

const router = express.Router();

// public routes

router.use(checkAuth);
// routes below this point require authentication

router.get("/", listsController.getLists);

router.get("/find/:lid", listsController.getListById);

router.get("/random", listsController.getRandomList);

router.use(checkAdmin);
// routes below this point require admin authentication

router.post(
  "/",
  // fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("type").not().isEmpty(),
    check("genre").not().isEmpty(),
  ],
  listsController.postCreateList
);

router.patch(
  "/:lid",
  [
    check("title").not().isEmpty(),
    check("type").not().isEmpty(),
    check("genre").not().isEmpty(),
  ],
  listsController.patchUpdateList
);

router.delete("/:lid", listsController.deleteList);

module.exports = router;
