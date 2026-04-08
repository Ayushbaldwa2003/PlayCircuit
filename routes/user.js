const express = require("express");
const {
  handleUserSignup,
  handleUserLogin,
  handleUserVerify,
  showVerifyPage,
} = require("../controllers/user");

const router = express.Router();

router.post("/", handleUserSignup);
router.post("/login", handleUserLogin);
router.get("/verify", showVerifyPage);
router.post("/verify", handleUserVerify);

module.exports = router;