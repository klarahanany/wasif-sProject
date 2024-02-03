const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0, // Ensure price is non-negative
  },
  quantity: {
    type: Number,
    required: true,
    min: 0, // Ensure quantity is non-negative
  },
  category: {
    type: String,
    required: true,
    enum: ["Wine", "Alcohol", "Beer", "Accessions"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  purchaseQuantity: {
    type: Number,
    required: true,
    min: 0, // Ensure purchaseQuantity is non-negative
    default: 0,
  },
});

const productModel = mongoose.model("Product", productSchema);

module.exports = productModel;
