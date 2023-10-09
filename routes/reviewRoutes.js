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
router.post('/addReview', async (req, res) => {
    try {
        const {user ,title, body, rating } = req.body
        // Create a new review instance
        const newReview = new Review({title , rating,author : user.firstname +" "+ user.lastname ,body});

        // Save the review to the database
        const savedReview = await newReview.save();

        console.log('Review added successfully:', savedReview);
        res.status(201).json("done")
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
