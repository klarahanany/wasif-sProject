const mongoose = require("mongoose");

// Define the review schema using Mongoose
const reviewSchema = new mongoose.Schema({
  // Title of the review, required field
  title: {
    type: String,
    required: true,
  },
  // Rating of the review, required with a minimum of 1 and a maximum of 5
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  // Author of the review, required field
  author: {
    type: String,
    required: true,
  },
  // Date of the review, defaults to the current date and time
  date: {
    type: Date,
    default: Date.now,
  },
  // Body or content of the review, required field
  body: {
    type: String,
    required: true,
  },
});

// Create a Mongoose model named "Review" based on the reviewSchema
const Review = mongoose.model("Review", reviewSchema);

// Export the Review model to be used in other parts of the application
module.exports = Review;
