const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const { currentUser, requireAuth } = require("../middleware/authMiddware");

// GET route to display reviews, requiring authentication
router.get("/", requireAuth, async (req, res) => {
  try {
    // Fetch reviews from your database
    const reviews = await Review.find();

    // Render the EJS page with the reviews data
    res.render("reviews", { reviews });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// POST route to add a new review
router.post("/addReview", async (req, res) => {
  try {
    const { user, title, body, rating } = req.body;

    // Create a new review instance
    const newReview = new Review({ title, rating, author: user.firstname + " " + user.lastname, body });

    // Save the review to the database
    const savedReview = await newReview.save();

    console.log("Review added successfully:", savedReview);
    res.status(201).json("done");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
