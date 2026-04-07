const express = require("express");
const router = express.Router();
const { restrictToLoggedinUserOnly } = require("../middlewares/auth");
const User = require("../models/user");

// Game selection page
router.get("/nim", (req, res) => {
  res.render("games/nim/home"); // choose mode
});

router.get("/nim/local", (req, res) => {
  res.render("games/nim/local");
});

router.get("/nim/multiplayer", restrictToLoggedinUserOnly, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.redirect("/login");
  }
  res.render("games/nim/multiplayer", { user });
});

module.exports = router;