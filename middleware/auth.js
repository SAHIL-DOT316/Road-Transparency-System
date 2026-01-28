// Check login
exports.isLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

// Officer only
exports.isOfficer = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  if (req.session.user.role !== "officer") {
    return res.status(403).send("Access denied: Officer only");
  }

  next();
};

// Public only
exports.isPublic = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  if (req.session.user.role !== "public") {
    return res.status(403).send("Access denied: Public only");
  }

  next();
};

// Admin only
exports.isAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  if (req.session.user.role !== "admin") {
    return res.status(403).send("Access denied: Admin only");
  }

  next();
};
