const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { isLoggedIn } = require("../middleware/auth");

/* ---------------- GET PAGES ---------------- */
router.get("/login", (req, res) => res.render("auth/login"));
router.get("/register", (req, res) => res.render("auth/register"));

/* ---------------- POST FORMS ---------------- */
// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.send("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({ name, email, password: hashedPassword, role: "public" });

    res.redirect("/login");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.send("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
    return res.render("auth/login", { error: "Invalid credentials" });
  }
if (user.mustChangePassword) {
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      role: user.role
    };
    return res.redirect("/force-reset-password");
  }
    // ✅ Save user in session
    req.session.user = {
    id: user._id.toString(),
    name: user.name,
    role: user.role
  };
  req.session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000;
    res.redirect("/");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.send("Logout failed");

    res.clearCookie("road-transparency-session");
    res.redirect("/login");
  });
});

router.get("/force-reset-password", isLoggedIn, (req, res) => {
  res.render("auth/forceReset");
});

router.post("/force-reset-password", isLoggedIn, async (req, res) => {
  const { password, confirm } = req.body;

  if (!password || !confirm)
    return res.send("All fields required");

  if (password !== confirm)
    return res.send("Passwords do not match");

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.findByIdAndUpdate(
    req.session.user.id,
    {
      password: hashedPassword,
      mustChangePassword: false
    },
    { new: true }
  );

  // destroy old session to avoid stale data
  req.session.destroy(() => {
    res.redirect("/login");
  });
});
module.exports = router;
