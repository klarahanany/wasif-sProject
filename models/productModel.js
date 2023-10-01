const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
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
});

const productModel = mongoose.model('Product', productSchema);

module.exports = productModel;
