const User = require("../models/user");
const { setUser } = require("../services/auth");

async function handleUserSignup(req, res) {
  const { name, email, password, redirectTo } = req.body;
  try {
    const user = await User.create({
      name,
      email,
      password,
    });

    const token = setUser(user);
    res.cookie("uid", token, { httpOnly: true });

    // ✅ redirect to original page
    return res.redirect(redirectTo || "/");

  } catch (error) {
    console.error("Signup error:", error);

    return res.render("signup", {
      error: "Unable to create account. Try again with a different email.",
      redirectTo: redirectTo || "" // ✅ preserve redirect
    });
  }
}

async function handleUserLogin(req, res) {
  const { email, password,redirectTo  } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.render("login", {
        error: "Invalid email or password.",
        redirectTo: redirectTo || ""
      });
    }

    const token = setUser(user);
    res.cookie("uid", token, { httpOnly: true });
    return res.redirect(redirectTo || "/");
  } catch (error) {
    console.error('Login error:', error);
    return res.render("login", {
      error: "Login failed. Please try again later.",
      redirectTo: redirectTo || ""
    });
  }
}

module.exports = {
  handleUserSignup,
  handleUserLogin,
};