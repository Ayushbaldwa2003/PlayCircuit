const User = require("../models/user");
const nodemailer = require("nodemailer");
const { setUser } = require("../services/auth");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "ayushbaldwa2003@gmail.com",
    pass: process.env.GMAIL_PASS || "nsryicowrznbrcwi",
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

console.log("📧 Email Transporter initialized");
console.log("   GMAIL_USER set:", !!process.env.GMAIL_USER);
console.log("   GMAIL_PASS set:", !!process.env.GMAIL_PASS);
console.log("   Using:", process.env.GMAIL_USER ? "Environment variables" : "Fallback credentials (dev mode)");

if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
  console.warn("⚠️  WARNING: GMAIL_USER or GMAIL_PASS environment variables not set!");
  console.warn("⚠️  Email notifications may fail on Render or production.");
  console.warn("⚠️  Set these in your Render environment variables for production.");
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function validateEmail(email) {
  return /^[^@\s]+@gmail\.com$/i.test(email);
}

function validatePassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

async function sendOtpEmail(email, otp) {
  const gmailUser = process.env.GMAIL_USER || "ayushbaldwa2003@gmail.com";
  const gmailPass = process.env.GMAIL_PASS || "nsryicowrznbrcwi";
  
  const mailOptions = {
    from: gmailUser,
    to: email,
    subject: "Your OTP verification code",
    text: `Your verification code is ${otp}. It is valid for 5 minutes.`,
  };
  
  console.log(`📧 Attempting to send OTP to ${email}...`);
  console.log(`   From: ${gmailUser}`);
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent successfully to ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send OTP to ${email}:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    throw error;
  }
}

async function handleUserSignup(req, res) {
  const { name, email, password, redirectTo } = req.body;
  const redirectUrl = redirectTo || "/";

  if (!name || !email || !password) {
    return res.render("signup", {
      error: "Name, Gmail address, and password are required.",
      name,
      email,
      redirectTo: redirectTo || "",
    });
  }

  if (!validateEmail(email)) {
    return res.render("signup", {
      error: "Email must be a valid @gmail.com address.",
      name,
      email,
      redirectTo: redirectTo || "",
    });
  }

  if (!validatePassword(password)) {
    return res.render("signup", {
      error:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      name,
      email,
      redirectTo: redirectTo || "",
    });
  }

  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.render("login", {
        error: "This email is already registered. Please log in.",
        email,
        redirectTo: redirectTo || "",
      });
    }

    let user;
    if (existingUser) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      existingUser.isVerified = false;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        otp,
        otpExpires,
        isVerified: false,
      });
    }

    try {
      await sendOtpEmail(email, otp);
    } catch (emailError) {
      console.error("❌ Email send error during signup:", emailError.message);
      if (emailError.code === "EAUTH") {
        console.error("   → Authentication failed. Check GMAIL_USER and GMAIL_PASS on Render.");
      }
      console.warn("⚠️  Proceeding to verification page despite email send failure.");
      console.warn("⚠️  User will see verification page but may not receive OTP email.");
    }

    return res.render("verify", {
      info: "OTP sent to your Gmail address. Enter it below within 5 minutes.",
      email,
      redirectTo: redirectTo || "",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.render("signup", {
      error: "Unable to create account. Try again later.",
      name,
      email,
      redirectTo: redirectTo || "",
    });
  }
}

async function handleUserLogin(req, res) {
  const { email, password, redirectTo } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.render("login", {
        error: "Invalid email or password.",
        email,
        redirectTo: redirectTo || "",
      });
    }

    if (!user.isVerified) {
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      
      try {
        await sendOtpEmail(email, otp);
      } catch (emailError) {
        console.error("❌ Email send error during login:", emailError.message);
        if (emailError.code === "EAUTH") {
          console.error("   → Authentication failed. Check GMAIL_USER and GMAIL_PASS on Render.");
        }
        console.warn("⚠️  Proceeding to verification page despite email send failure.");
        console.warn("⚠️  User will see verification page but may not receive OTP email.");
      }

      return res.render("verify", {
        info: "Your account is not verified. We sent a fresh OTP to your Gmail.",
        email,
        redirectTo: redirectTo || "",
      });
    }

    const token = setUser(user);
    res.cookie("uid", token, { httpOnly: true });
    return res.redirect(redirectTo || "/");
  } catch (error) {
    console.error("Login error:", error);
    return res.render("login", {
      error: "Login failed. Please try again later.",
      email,
      redirectTo: redirectTo || "",
    });
  }
}

function showVerifyPage(req, res) {
  return res.render("verify", {
    email: req.query.email || "",
    redirectTo: req.query.redirectTo || "",
  });
}

async function handleUserVerify(req, res) {
  const { email, otp, redirectTo } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("verify", {
        error: "No account found for that email.",
        email,
        redirectTo: redirectTo || "",
      });
    }

    if (!user.otp || user.otp !== otp) {
      return res.render("verify", {
        error: "Invalid OTP. Please enter the code sent to your Gmail.",
        email,
        redirectTo: redirectTo || "",
      });
    }

    if (!user.otpExpires || new Date() > user.otpExpires) {
      return res.render("verify", {
        error: "OTP expired. Please sign up or login again to receive a new code.",
        email,
        redirectTo: redirectTo || "",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = setUser(user);
    res.cookie("uid", token, { httpOnly: true });
    return res.redirect(redirectTo || "/");
  } catch (error) {
    console.error("Verify error:", error);
    return res.render("verify", {
      error: "Verification failed. Please try again.",
      email,
      redirectTo: redirectTo || "",
    });
  }
}

module.exports = {
  handleUserSignup,
  handleUserLogin,
  showVerifyPage,
  handleUserVerify,
};