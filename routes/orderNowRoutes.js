const Router = require('express')
const router = Router()
// const authController = require('../controllers/authController')
const { render } = require("ejs");
const { currentUser, requireAuth } = require("../middleware/authMiddware");

const calculateTotal = (cartItems) => {
    // Initialize a variable to store the total
    let total = 0;

    // Loop through the cart items and add up their prices
    for (const item of cartItems) {
        total += item.price;
    }

    // Return the total rounded to 2 decimal places (for currency)
    return total.toFixed(2);
}
const cartItems = [
    {
        id: 1,
        name: 'Spiritual Tea',
        description: 'A calming and soothing tea for mindfulness.',
        quantity: 2,

        price: 5.99
    },
    {
        id: 2,
        name: 'Meditation Coffee',
        description: 'Awaken your senses with our meditation coffee blend.',
        quantity: 2,
        price: 4.99
    },
    {
        id: 3,
        name: 'Zen Juice',
        description: 'A refreshing juice that brings inner peace.',
        quantity: 2,
        price: 3.49
    }
];

router.post('/add-to-cart', (req, res) => {
    console.log(req.body.drinkId)
    console.log(req.body.quantity)

})
var total = calculateTotal(cartItems);
router.get('/cart', requireAuth, (req, res) => {
    res.render('cart', { cartItems, total })
})

module.exports = router