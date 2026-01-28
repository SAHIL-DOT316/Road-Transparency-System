const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

/* =========================
   🔥 REQUIRED FOR RENDER
========================= */
app.set("trust proxy", 1); // IMPORTANT for secure cookies

/* =========================
   BODY PARSERS
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   SESSION CONFIG
========================= */
app.use(
  session({
    name: "road-transparency-session",
    secret: process.env.SESSION_SECRET, // MUST be set in Render
    resave: false,
    saveUninitialized: false,

    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      httpOnly: true,
      secure: true,      // ✅ Render uses HTTPS
      sameSite: "lax"
    },

    store: MongoStore.default.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions"
    })
  })
);

/* =========================
   GLOBAL USER ACCESS (EJS)
========================= */
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

/* =========================
   VIEW ENGINE (EJS)
========================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* =========================
   STATIC FILES
========================= */
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   ROUTES
========================= */
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/pageRoutes"));

app.use("/admin", require("./routes/adminRoutes"));
app.use("/analytics", require("./routes/analyticsRoutes"));

app.use("/api/roads", require("./routes/roadRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/contractors", require("./routes/contractorRoutes"));
app.use("/api/road-photos", require("./routes/roadPhotoRoutes"));

/* =========================
   404 HANDLER (LAST)
========================= */
app.use((req, res) => {
  res.status(404).render("404");
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
