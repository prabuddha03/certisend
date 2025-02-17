const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Google Auth Routes
router.get("/google", (req, res, next) => {
  const { redirect_uri, state } = req.query;

  // Store the redirect_uri and state in session
  req.session.oauth = { redirect_uri, state };

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login?error=Google authentication failed",
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      const { redirect_uri, state } = req.session.oauth || {};

      // Clear the session
      req.session.oauth = null;

      // Use the stored redirect_uri from the session
      const redirectUrl = new URL(
        redirect_uri || `${process.env.FRONTEND_URL}/login`
      );
      redirectUrl.searchParams.append("token", token);
      if (state) {
        redirectUrl.searchParams.append("redirect", state);
      }

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(
        `${process.env.FRONTEND_URL}/login?error=Authentication failed`
      );
    }
  }
);

// Update the POST route to handle the token properly
router.post("/google/callback", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Decode the token to get user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user using the decoded token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Generate a new JWT token
    const jwtToken = generateToken(user);

    // Return user data and token
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    console.error("Google callback error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
});

// Error handler
router.use((err, req, res, next) => {
  console.error("Auth route error:", err);
  res.status(500).json({ message: "Authentication failed" });
});

module.exports = router;
