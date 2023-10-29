const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    image: {
        type: String, // Assuming you store the URL of the image
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        // Removes leading/trailing whitespace
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
        min: 0, // Ensure price is non-negative
    },
    category: {
        type: String,
        required: true,
        enum: ['Wine', 'Alcohol', 'Beer', 'Accessions'], // Example categories
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    purchaseQuantity:{
        type: Number,
        required: true,
        min: 0, // Ensure price is non-negative
        default: 0,
    },

});

const productModel = mongoose.model('Product', productSchema);

module.exports = productModel;
