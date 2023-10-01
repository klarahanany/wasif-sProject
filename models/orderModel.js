const mongoose = require('mongoose');

const { Schema } = mongoose;

const orderSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    order_date: {
        type: Date,
        default: Date.now
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true
            },
        },
    ],
    total_amount: {
        type: Number,
        required: true
    },

    payment: {
        card_number: {
            type: String,
            required: true
        },
        expiration_date: {
            type: String,
            required: true
        },
        payment_method: {
            type: String,
            required: true
        },
    },
    status: {
        type: String,
        enum: ['pending', 'Ready', 'delivered'],
        default: 'pending'
    },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
