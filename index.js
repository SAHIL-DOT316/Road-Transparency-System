const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
dotenv.config();
connectDB();

const app = express();

// parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// session
console.log("MongoStore:", MongoStore);

app.use(
  session({
    name: "road-transparency-session",
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,

    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 🔥 14 DAYS
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Render support
      sameSite: "lax"
    },

    store: MongoStore.default.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions"
    })
  })
);
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// static
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// routes
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/pageRoutes"));
app.use("/analytics", require("./routes/analyticsRoutes"));

app.use("/admin", require("./routes/adminRoutes"));
app.use("/api/roads", require("./routes/roadRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/contractors", require("./routes/contractorRoutes"));
app.use("/api/road-photos", require("./routes/roadPhotoRoutes"));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
