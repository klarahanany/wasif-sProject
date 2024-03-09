const mongoose = require("mongoose");

// Define the cart schema using Mongoose
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Reference to the "user" model
    required: true,
  },
  // Array of items in the cart, each item includes productId and quantity
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Reference to the "Product" model
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1, // Ensure quantity is at least 1
      },
    },
  ],
  // Creation date of the cart, defaults to the current date and time
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a Mongoose model named "Cart" based on the cartSchema
const cartModel = mongoose.model("Cart", cartSchema);

// Export the Cart model to be used in other parts of the application
module.exports = cartModel;
