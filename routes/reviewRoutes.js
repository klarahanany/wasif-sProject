const express = require('express');
const router = express.Router();
const Review = require('../models/Review'); // Assuming you have a Review model
const { currentUser, requireAuth } = require("../middleware/authMiddware");

router.get('/',requireAuth, async (req, res) => {
    try {
        const reviews = await Review.find(); // Fetch reviews from your database
        res.render('reviews', { reviews }); // Render the EJS page with the reviews data
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
