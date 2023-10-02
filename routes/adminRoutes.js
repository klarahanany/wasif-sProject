const Router = require('express')
const express = require('express');
const router = Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { render } = require("ejs");
const { currentUser, requireAuthAdmin } = require("../middleware/authMiddware");
const productModel = require('../models/productModel.js');
const userModel = require('../models/userModel.js')
const orderModel = require('../models/orderModel.js')
const cartModel = require('../models/cartModel.js')
const multer = require('multer');
const path = require('path')
// Set up Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public'); // Specify the directory where files should be saved
    },
    filename: function (req, file, cb) {
        // Use the original name of the file
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });
const maxAge = 3 * 24 * 60 * 60;
//takes user id from database
const createToken = (id) => {
    //save user id in the token
    return jwt.sign({ id }, 'mysecretcode', {
        expiresIn: maxAge // 3 days
    })
}
const handleErrors = (err) => {

    let errors = { username: '', password: '' };

    //incorrect email
    if (err === 'incorrect username') {
        errors.username = 'that username is not registered'
    }
    if (err == 'incorrect password') {
        errors.password = 'incorrect password'

    }
    // validation errors
    else if (err === 'user validation failed') {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}
router.get('/logout', async (req, res) => {
    res.cookie('jwtAdmin', '', { maxAge: 1 }) //replace the current cookie with empty string
    res.redirect('/admin')

})
router.get('/loginErrorAdmin', (req, res) => {
    res.render('loginErrorAdmin')
})
router.get('/', (req, res) => { //to display the UI
    res.render('adminLogin')
})
router.post('/', async (req, res) => { //to display the UI
    const username = req.body.username
    const password = req.body.password
    try {
        const user = await userModel.findOne({ username })
        if (user && user.role == 'admin') {
            console.log("what")
            const auth = await bcrypt.compare(password, user.password)
            console.log("what")
            console.log(auth)
            if (auth) { //if password is correct after comparing
                const token = createToken(user._id)
                console.log(token)
                //sending the token as a cookie to frontend
                console.log("what")

                res.cookie('jwtAdmin', token, { httpOnly: true, maxAge: maxAge * 1000 })
                console.log("what")

                res.status(201).json({ user: user._id }) // send back to frontend as json body

            }
            else {

                const error = handleErrors('incorrect password')
                console.log(error)
                res.status(400).json({ error })
            }

        } else { //if user exists in db
            const error = handleErrors('incorrect username')
            console.log(error)
            res.status(400).json({ error })
        }
    } catch (e) {
        const error = handleErrors(e)
        console.log(error)
        res.status(400).json({ error })
    }
})
router.get('/inventory', requireAuthAdmin, async (req, res) => {
    const options = [];
    const products = await productModel.find()
    for (let index = 0; index < products.length; index++) {
        const element = { value: products[index].name, label: products[index].name }
        options.push(element)
    }
    res.render('adminInventory', { products, options })
});
router.post('/inventory/update-product', async (req, res) => {
    console.log(req.body)
    const { selectedValue, description, price, quantity, category } = req.body
    productModel.findOneAndUpdate(
        { name: selectedValue },
        { description: description, price: price, category: category, quantity: quantity },
        { new: true, useFindAndModify: false }
    )
        .then(updatedProduct => {
            // Log the updated product
            console.log('Updated Product:', updatedProduct);
        })
        .catch(err => {
            console.error('Error updating document:', err);
        })
    res.json('done')
});
router.post('/inventory/delete-product', async (req, res) => {
    const { selectedValue } = req.body
    try {
        const deletedDocument = await productModel.findOneAndDelete({ name: selectedValue });

        if (!deletedDocument) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.json('done')
        // return res.json({ message: 'Document deleted successfully', deletedDocument });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
// router.use('/images', express.static(path.join(__dirname, 'images')));

router.post('/inventory/add-product', upload.single("image"), async (req, res) => {
    var flag = 0;
    const { newProductName, description, selectOption, price, quantity } = req.body
    const products = await productModel.find()
    for (let index = 0; index < products.length; index++) {
        const currentName = products[index].name;

        if (newProductName === currentName) {
            flag = 1;
            res.status(400).json({ error: "product name already exist" })
        }

    }
    if (flag == 0) {
        if (selectOption == 'selectCategory') {
            res.status(400).json({ error: "please select category" })
        }
        else if (price <= 0) {
            res.status(400).json({ error: "enter valid price" })
        }
        else if (quantity < 0) {
            res.status(400).json({ error: "please choose relevante quantity" })

        }
        else {
            const newProduct = new productModel({
                image: req.file.filename,
                name: newProductName,
                description: description,
                price: price,
                quantity: quantity,
                category: selectOption,
            });

            // // Save the new product to the database
            newProduct.save()
                .then(() => {
                    console.log('Product saved successfully.');
                    res.status(201).json({status:"product has been added"})
                })
                .catch((error) => {
                    console.error('Error saving product:', error);
                });
           
        }
    }
});

router.get('/usermanagment', requireAuthAdmin, async (req, res) => {
    const users = await userModel.find()
    res.render('adminUserManagment', { users })
});
router.post('/usermanagment/block-user/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log(userId)
    try {
        // Fetch the user from the database based on the userId
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Toggle the isBlocked status
        user.isBlocked = !user.isBlocked;

        // Save the updated user back to the database
        await user.save();

        // Redirect or send a response as needed
        res.redirect('/admin/usermanagment'); // Redirect back to the user management page
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });

    }
});

router.get('/allOrders', requireAuthAdmin, async (req, res) => {
    try {
        const orders = await orderModel.find({})
            .populate('userId', 'username')
            .populate('items.productId', 'name');
        console.log('Orders:', orders);
        res.render('adminAllOrders', { orders })

        // Optionally close the connection here if you're not using it elsewhere
    } catch (err) {
        console.error('Error:', err);
        // Optionally close the connection here if you're not using it elsewhere
    }
    // const orders = await orderModel.find()
});
module.exports = router