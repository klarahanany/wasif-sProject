const Router = require('express')
const router = Router()
const cartModel = require('../models/cartModel.js')
const orderModel = require('../models/orderModel.js')

const { render } = require("ejs");
const { currentUser, requireAuth } = require("../middleware/authMiddware");
const productModel = require('../models/productModel.js');

function calculateTotal(cartItems) {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
}
router.get('/', requireAuth, async (req, res) => {
    const user = res.locals.user;
    var userId = user._id
    const drinks = await productModel.find()
    res.render('orderNow', { drinks, userId })
});

router.post('/add-to-cart', async (req, res) => {
    const productId = req.body.drinkId.trim();; // Replace with the actual product ID
    const quantity = req.body.quantity; // Set the quantity as needed
    // const user =res.locals.user;
    const userId = req.body.userId.trim();
    try {
        // Find the user's cart by user ID
        let cart = await cartModel.findOne({ userId: userId });
        if (!cart) {
            // Create a new cart if one doesn't exist for the user
            cart = new cartModel({
                userId: userId,
                items: [],
            });
        }
        // Add the new item to the cart's items array
        var productIndex = -1;
        productIndex = cart.items.findIndex(item => item.productId.equals(productId));
        if (productIndex !== -1) {
            cart.items[productIndex].quantity += parseInt(quantity);
        }
        else {
            cart.items.push({
                productId,
                quantity,
            });
        }
        // Save the cart with the new item
        const updatedCart = await cart.save();
    } catch (err) {
        // Handle any errors
        console.error(err);
    }

    res.json("done")

})

router.get('/cart', requireAuth, async (req, res) => {
    const user = res.locals.user;
    const products = await productModel.find()
    var userId = user._id
    const currentUserCart = await cartModel.findOne({ userId: user._id })
    var cartItems = []
    if (currentUserCart) {
        var cartData = currentUserCart.items
        cartData.forEach(item => {
            products.forEach(product => {
                if (item.productId.equals(product._id)) {
                    cartItems.push({
                        "productId": product._id,
                        "name": product.name,
                        "price": product.price,
                        "quantity": item.quantity,
                        "image":product.image
                    })
                }

            })
        })
    }
    var total = calculateTotal(cartItems);
    res.render('cart', { cartItems, total, userId })
})
router.post('/cart/deleteItem', async (req, res) => {
    var productId = req.body.itemID
    var userId = req.body.userId

    try {
        let cart = await cartModel.findOne({ userId: userId });
        // .filter(item => item.id !== productId);
        const updatedCartItems = cart.items
        var newArray = updatedCartItems.filter((item) => item.productId != productId);
        cartModel.updateOne({ userId: userId }, { $set: { items: newArray } })
            .then((result) => {
                console.log('Successfully updated items:', result);
            })
            .catch((error) => {
                console.log('Error updating items:', error);
            });
        res.json("Done")
    } catch (err) {
        // Handle any errors
        console.error(err);
    }

})

router.post('/cart/changeQuan', async (req, res) => {
    var productId = req.body.productId
    var newQuantity = req.body.newQuan
    var userId = req.body.userId
    var cartItems = req.body.cartItems
    try {
        const updatedCartItems = cartItems
        cartModel.updateOne({ userId: userId }, { $set: { items: updatedCartItems } })
            .then((result) => {
                console.log('Successfully updated items:', result);
            })
            .catch((error) => {
                console.log('Error updating items:', error);
            });
        res.json("Done")
    } catch (err) {
        // Handle any errors
        console.error(err);
    }
})
router.get('/cart/payment', requireAuth, async (req, res) => {
    res.render('payment')
})
router.post('/cart/payment', async (req, res) => {
    const { cardNumber, cardHolder, expirationDate, cvv, paymentMethod, user } = req.body
    if (paymentMethod == 'creditCard') {
        if (!validatecardNumber(cardNumber)) {
            res.status(400).json({ status: "cardNumber not valid" })
        }
        else if (!validatecardHolder(cardHolder)) {
            res.status(400).json({ status: "cardHolder not valid" })
        }
        else if (!validateexpirationDate(expirationDate)) {
            res.status(400).json({ status: "expirationDate not valid" })
        }
        else if (!validatecvv(cvv)) {
            res.status(400).json({ status: "cvv not valid" })
        }
        // else{
        var total = 0;
        console.log(user._id)
        const cartForCurrentUser = await cartModel.findOne({ userId: user._id })
        var items = cartForCurrentUser.items
        for (let index = 0; index < items.length; index++) {
            const element = items[index];
            const product = await productModel.findOne({ _id: element.productId })
            total += product.price * element.quantity

        }
        console.log(cartForCurrentUser.items)
        const newOrder = new orderModel({
            userId: cartForCurrentUser.userId, // Replace with a valid user ID from your UserModel
            items: cartForCurrentUser.items,
            total_amount: total, // Replace with the actual total amount
            payment: {
                card_number: cardNumber, // Replace with a valid card number
                expiration_date: expirationDate, // Replace with a valid expiration date
                payment_method: 'Visa', // Replace with the actual payment method
            },
            status: 'pending', // Default status is 'pending', you can change it if needed
        });

        // Save the new order to the database
        newOrder.save()
            .then(savedOrder => {
                console.log('Order saved successfully:', savedOrder);
            })
            .catch(error => {
                console.error('Error saving order:', error);
            })
        cartModel.updateOne(
            { userId: cartForCurrentUser.userId },
            { $set: { items: [] } },
        )
            .then(result => {
                if (result.nModified > 0) {
                    console.log('Cart cleared successfully');
                } else {
                    console.log('User not found or cart was already empty');
                }
            })
            .catch(error => {
                console.error('Error clearing cart:', error);
            })


    }
    else {

    }
})
function validatecardNumber(cardNumber) {
    const cardNumberRegex = /^[0-9]{16}$/;
    if (!cardNumberRegex.test(cardNumber)) {
        return false; // Invalid card number format
    }
    return true
}
function validatecardHolder(cardHolder) {
    // Validate Cardholder Name (Assuming alphabetical characters only for simplicity)
    const cardHolderRegex = /^[A-Za-z\s]+$/;
    if (!cardHolderRegex.test(cardHolder)) {
        return false; // Invalid cardholder name format
    }
    return true
}
function validatecvv(cvv) {
    // Validate CVV (Assuming a 3-digit CVV)
    const cvvRegex = /^[0-9]{3}$/;
    if (!cvvRegex.test(cvv)) {
        return false; // Invalid CVV format
    }
    return true
}
function validateexpirationDate(expirationDate) {
    // Validate Expiration Date (Assuming MM/YY format)
    const expirationDateRegex = /^(0[1-9]|1[0-2])\/[0-9]{2}$/;
    if (!expirationDateRegex.test(expirationDate)) {
        return false; // Invalid expiration date format
    }
    return true
}

module.exports = router