// JSON WEB TOKEN AND USER MODEL MODULES
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// User
// MIDDLEWARE FOR REQUIRING AUTHENTICATION
// Verify the token for any route we choose to protect
const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt; // Get the token from the cookie (if the user is already signed in)

  // Check if JWT exists and is verified
  if (token) {
    jwt.verify(token, "mysecretcode", (err, decodedToken) => {
      if (err) {
        // If the token is present but not valid
        console.log(err.message);
        res.redirect("/login");
      } else {
        // Valid user
        console.log(decodedToken);
        next();
      }
    });
  } else {
    // The user isn't logged in
    res.redirect("/loginError");
    res.status(400).end();
  }
};

// Admin
// MIDDLEWARE FOR REQUIRING ADMIN AUTHENTICATION
// Verify the admin token for any route we choose to protect
const requireAuthAdmin = (req, res, next) => {
  const token = req.cookies.jwtAdmin; // Get the token from the cookie (if the admin is already signed in)

  // Check if JWT exists and is verified
  if (token) {
    jwt.verify(token, "mysecretcode", (err, decodedToken) => {
      if (err) {
        // If the token is present but not valid
        console.log(err.message);
        res.redirect("/admin");
      } else {
        // Valid admin user
        console.log(decodedToken);
        next();
      }
    });
  } else {
    // The admin user isn't logged in
    res.redirect("/admin/loginErrorAdmin");
    res.status(400).end();
  }
};

// MIDDLEWARE TO CHECK CURRENT USER
const currentUser = (req, res, next) => {
  const token = req.cookies.jwt; // Get the token from the cookie (if the user is already signed in)

  // Check if JWT exists and is verified
  if (token) {
    // Verify the token, and then get the decoded token on the callback function which has the saved user ID
    jwt.verify(token, "mysecretcode", async (err, decodedToken) => {
      if (err) {
        // If the token is present but not valid
        console.log(err.message);
        res.locals.user = null;
        next();
      } else {
        // Valid user
        console.log(decodedToken);
        res.locals.user = await userModel.findById(decodedToken.id);
        next();
      }
    });
  } else {
    // No user logged in
    res.locals.user = null;
    next();
  }
};

// MIDDLEWARE TO CHECK CURRENT ADMIN USER
const currentAdminUser = (req, res, next) => {
  const token = req.cookies.jwtAdmin; /// Get the token from the cookie (if the admin is already signed in)
  // If the token is present but not valid
  if (token) {
    // Verify the token, and then get the decoded token on the callback function which has the saved user ID
    jwt.verify(token, "mysecretcode", async (err, decodedToken) => {
      if (err) {
        // If the token is present but not valid
        console.log(err.message);
        res.locals.admin = null;
        next();
      } else {
        // Valid admin user
        console.log(decodedToken);
        res.locals.admin = await userModel.findById(decodedToken.id);
        next();
      }
    });
  } else {
    // No admin user logged in

    res.locals.admin = null;
    next();
  }
};

// EXPORT MODULES FOR USE IN OTHER FILES
module.exports = { requireAuth, currentUser, currentAdminUser, requireAuthAdmin };
