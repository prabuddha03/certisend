const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const passport = require("passport");
const session = require("express-session");
const bodyParser = require("body-parser");

require("dotenv").config();
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");
const participantRoutes = require("./routes/participantRoutes");
const googleFormsRoutes = require("./routes/googleFormsRoutes");
const eventUpdateRoutes = require("./routes/eventUpdateRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const redis = require('./config/redis');



// Connect to MongoDB
async function initializeServices() {
  try {
    // Test Redis first
    await redis.ping();
    console.log('✅ Redis Connected Success');

    // Then connect MongoDB
    await connectDB();
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('Service initialization error:', error);
    // Continue even if Redis fails
  }
}
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
// Middleware

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

app.use(passport.initialize());
require("./config/passport");

app.use(helmet());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/events/:eventId/participants", participantRoutes);
app.use("/api/participants/", participantRoutes);
app.use("/api/google-forms", googleFormsRoutes);
app.use("/api/events/:eventId/updates", eventUpdateRoutes);
app.use("/api/updates", eventUpdateRoutes); // For direct access to updates
app.use("/api/leaderboards", leaderboardRoutes);
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();