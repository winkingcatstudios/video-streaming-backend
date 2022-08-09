const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");
const fileUpload = require("../middleware/file-upload");
const checkAdmin = require("../middleware/check-admin");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 12 }, { max: 127 }),
  ],
  usersController.postSignup
);

router.post("/login", usersController.postLogin);

router.use(checkAdmin);
// routes below this point require admin authentication

router.put("/:id", usersController.putUpdate);

module.exports = router;
