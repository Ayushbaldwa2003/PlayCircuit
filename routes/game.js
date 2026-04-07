const express = require("express");
const router = express.Router();
const { restrictToLoggedinUserOnly } = require("../middlewares/auth");
const User = require("../models/user");

// Game selection page
router.get("/nim", (req, res) => {
  res.render("games/nim/Home"); // choose mode
});


router.get("/nim/local", (req, res) => {
  res.render("games/nim/local");
});


router.get("/nim/multiplayer", restrictToLoggedinUserOnly, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.render("games/nim/multiplayer", { user: user });
});

module.exports = router;