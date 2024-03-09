const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the order schema using Mongoose
const orderSchema = new Schema({
  // Reference to the user who placed the order
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Reference to the "user" model
    required: true,
  },
  // Order date, defaults to the current date and time
  order_date: {
    type: Date,
    default: Date.now,
  },
  // Array of items in the order, each item includes productId and quantity
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
      },
    },
  ],
  // Total amount for the order
  total_amount: {
    type: Number,
    required: true,
  },
  // Payment details
  payment: {
    card_number: {
      type: String,
    },
    expiration_date: {
      type: String,
    },
    payment_method: {
      type: String,
      required: true,
    },
  },
  // Order status with default set to "pending"
  status: {
    type: String,
    enum: ["pending", "Ready", "delivered"], // Allowed values for the status
    default: "pending",
  },
});

// Create a Mongoose model named "Order" based on the orderSchema
const Order = mongoose.model("Order", orderSchema);

// Export the Order model to be used in other parts of the application
module.exports = Order;
