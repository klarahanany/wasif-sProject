const Router = require('express')
const express = require('express');
const router = Router()
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { render } = require("ejs");
const { currentUser, requireAuthAdmin } = require("../middleware/authMiddware");
const Review = require('../models/Review'); // Assuming you have a Review model
const productModel = require('../models/productModel.js');
const userModel = require('../models/userModel.js')
const orderModel = require('../models/orderModel.js')
const cartModel = require('../models/cartModel.js')
const multer = require('multer');
const path = require('path')
const json2xls = require('json2xls');
const tmp = require('tmp');
const fs = require('fs');
const xlsx = require('xlsx');
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

// Error handler
const handleErrors = (err) => {

    let errors = { username: '', password: '' };

    // Incorrect user/admin
    if (err === 'incorrect username') {
        errors.username = 'you are not an admin'
    }

    // Incorrect password admin
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

const handleErrors2 = (err, usernameValue, emailValue) => {

    let errors = { username: '', email: '', password: '' };

    // Duplicate username error
    if (err.message === `E11000 duplicate key error collection: SpiritualDrinksShop.users index: username_1 dup key: { username: "${usernameValue}" }`) {
        errors.username = 'that username is already registered';
        return errors;
    }

    // Duplicate email error
    if (err.message === `E11000 duplicate key error collection: SpiritualDrinksShop.users index: email_1 dup key: { email: "${emailValue}" }`) {
        errors.email = 'that email is already registered';
        return errors;
    }

    // validation errors
    else if (err === 'user validation failed') {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        });
    }
}

router.get('/logout', async (req, res) => {
    res.cookie('jwtAdmin', '', { maxAge: 1 }) //replace the current cookie with empty string
    res.redirect('/admin')

})
router.get('/loginErrorAdmin', (req, res) => {
    res.render('loginErrorAdmin')
})
router.get('/reviews', requireAuthAdmin, async (req, res) => {
    try {
        const reviews = await Review.find({})
        res.render('adminReviews', { reviews })
    } catch (err) {
        console.error('Error:', err);
    }

});
router.post('/reviews/deleteItem', async (req, res) => { //to display the UI
    const ReviewId = req.body.ReviewId
    try {
        const removedItem = await Review.findByIdAndRemove(ReviewId);

        if (removedItem) {
            console.log(`Item with ID ${ReviewId} removed successfully.`);
            res.json('DONE')
        } else {
            console.log(`Item with ID ${ReviewId} not found.`);
        }
    } catch (err) {
        console.error(err);
        // Handle the error (e.g., send an error response)
    }
})
router.get('/', (req, res) => { //to display the UI
    res.render('adminLogin')
})
router.post('/', async (req, res) => { //to display the UI
    const username = req.body.username
    const password = req.body.password
    try {
        const user = await userModel.findOne({ username })
        if (user && (user.role == 'worker' || user.role == 'mainadmin')) {
            const auth = await bcrypt.compare(password, user.password)
            if (auth) { //if password is correct after comparing
                const token = createToken(user._id)
                console.log(token)
                //sending the token as a cookie to frontend
                res.cookie('jwtAdmin', token, { httpOnly: true, maxAge: maxAge * 1000 })
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
    const products = await productModel.find().sort({ quantity: 1 });
    for (let index = 0; index < products.length; index++) {
        const element = { value: products[index].name, label: products[index].name }
        options.push(element)
    }
    res.render('adminInventory', { products, options })
});
// Add the route to download data as JSON
router.get('/inventory/downloadProductsData', async (req, res) => {
    try {
        // Fetch data from MongoDB
        const data = await productModel.find({});

        // Convert specific fields to Excel format
        const xls = json2xls(

            data.map(item => {
                return {
                    // Include the specific fields you want in the Excel file
                    'image': item.image,
                    'name': item.name,
                    'description': item.description,
                    'category': item.category,
                    'quantity': item.quantity,
                    'price': item.price,
                    // Add more fields as needed
                };
            })
        );

        // Create a temporary file
        tmp.file((err, tempFilePath) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            // Write the Excel data to the temporary file
            fs.writeFileSync(tempFilePath, xls, 'binary');

            // Set response headers for downloading
            res.setHeader('Content-disposition', 'attachment; filename=data.xlsx');
            res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // Stream the file to the client
            res.sendFile(tempFilePath, (err) => {
                // Remove the temporary file after it has been sent
                fs.unlinkSync(tempFilePath);
                if (err) {
                    console.error(err);
                    res.status(500).send('Internal Server Error');
                }
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
router.post('/inventory/update-product', upload.single("image"), async (req, res) => {
    console.log(req.body)
    const { selectName, description, price, quantity, selectOption } = req.body
    if (req.file) {
        productModel.findOneAndUpdate(
            { name: selectName },
            { description: description, price: price, category: selectOption, quantity: quantity, image: req.file.filename },
            { new: true, useFindAndModify: false })
            .then(updatedProduct => {
                console.log('Updated Product:', updatedProduct);
            })
            .catch(err => {
                console.error('Error updating document:', err);
            })
        res.json('done')
    }
    else {
        productModel.findOneAndUpdate(
            { name: selectName },
            { description: description, price: price, category: selectOption, quantity: quantity },
            { new: true, useFindAndModify: false })
            .then(updatedProduct => {
                console.log('Updated Product:', updatedProduct);
            })
            .catch(err => {
                console.error('Error updating document:', err);
            })
        res.json('done')
    }
});
router.post('/inventory/update-product/changes', async (req, res) => {
    console.log(req.body)
    const products = await productModel.find()
    res.json({ products: products })
})
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
                    res.status(201).json({ status: "product has been added" })
                })
                .catch((error) => {
                    console.error('Error saving product:', error);
                });

        }
    }
});

router.get('/usermanagment', requireAuthAdmin, async (req, res) => {
    const admin = res.locals.admin;
    if (admin.role == 'mainadmin') {
        const users = await userModel.find({ role: { $in: ['worker', 'normal'] } })

        res.render('adminUserManagment', { users })
    }
    else if (admin.role == 'worker') {
        const users = await userModel.find({ role: { $in: ['normal'] } })

        res.render('adminUserManagment', { users })
    }
});
// Add the route to download data as JSON
router.get('/usermanagment/downloadUserData', async (req, res) => {
    try {
        // Fetch data from MongoDB
        const data = await userModel.find({ role: { $in: ['normal', 'worker'] } });

        // Convert specific fields to Excel format
        const xls = json2xls(

            data.map(item => {
                var isBlocked = item.isBlocked ? 'Blocked' : 'Active'
                return {
                    // Include the specific fields you want in the Excel file
                    'Username': item.username,
                    'First Name': item.firstname,
                    'Last Name': item.lastname,
                    'Birth Date': item.birthday,
                    'Status': isBlocked,
                    'Role': item.role,
                    // Add more fields as needed
                };
            })
        );

        // Create a temporary file
        tmp.file((err, tempFilePath) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            // Write the Excel data to the temporary file
            fs.writeFileSync(tempFilePath, xls, 'binary');

            // Set response headers for downloading
            res.setHeader('Content-disposition', 'attachment; filename=data.xlsx');
            res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // Stream the file to the client
            res.sendFile(tempFilePath, (err) => {
                // Remove the temporary file after it has been sent
                fs.unlinkSync(tempFilePath);
                if (err) {
                    console.error(err);
                    res.status(500).send('Internal Server Error');
                }
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
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
router.post('/usermanagment/addadmin', async (req, res) => {
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password
    const firstname = req.body.firstname
    const lastname = req.body.lastname
    const birthday = req.body.birthday
    const phoneNumber = "0000000000"
    try {
        const user = await userModel.create({ username, email, password, firstname, lastname, birthday,phoneNumber, role: "worker" });
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'aff.markssh@gmail.com',
                pass: 'zcdaufonyexxotnw'

            }
        });

        var mailOptions = {
            from: 'lart0242@gmail.com',
            to: email,
            subject: 'adding worker',
            text: `you have an account now as an worker,
            username: ${username}
            password: ${password}
            login here: http://localhost:3000/admin
            and please change your password in your profile`
        };

        transporter.sendMail(mailOptions, async function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        res.status(201).json("done") // send back to frontend as json body

    } catch (e) {
        const error = handleErrors2(e, username, email)
        console.log(error)
        res.status(400).json({ error });
    }
});
router.post('/usermanagment/deleteadmin', async (req, res) => {
    console.log(req.body)
    const username = req.body.username
    try {
        // Define a condition to identify the user you want to delete
        const condition = { username: username };

        // Use deleteOne to delete a single document that matches the condition
        const user = await userModel.findOne({ username: username })
        const result = await userModel.deleteOne(condition);

        console.log('User deleted successfully');
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'aff.markssh@gmail.com',
                pass: 'zcdaufonyexxotnw'

            }
        });

        var mailOptions = {
            from: 'lart0242@gmail.com',
            to: user.email,
            subject: 'Deleting Worker',
            text: `Your account has been deactivated. You no longer have administrator privileges.`
        };

        transporter.sendMail(mailOptions, async function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        res.status(201).json("done")

    } catch (error) {
        console.error('Error deleting user:', error);
    }


});
router.get('/allOrders', requireAuthAdmin, async (req, res) => {
    try {
        const orders = await orderModel.find({})
            .populate('userId', 'username')
            .populate('items.productId', 'name');
        res.render('adminAllOrders', { orders })
        // Optionally close the connection here if you're not using it elsewhere
    } catch (err) {
        console.error('Error:', err);
        // Optionally close the connection here if you're not using it elsewhere
    }
    // const orders = await orderModel.find()
});
// Add the route to download data as JSON
router.get('/allOrders/downloadOrdersData', async (req, res) => {
    try {
        // Fetch data from MongoDB
        const data = await orderModel.find({});

        // Convert specific fields to Excel format
        const xls = json2xls(
            await Promise.all(
                data.map(async (item) => {
                    const userdata = await userModel.findOne({ _id: item.userId });
                    console.log(userdata);

                    return {
                        // Include the specific fields you want in the Excel file
                        'Order Date': item.order_date,
                        'username': userdata.username,
                        'Total Amount': item.total_amount,
                        'Payment Method': item.payment.payment_method,
                        'Order Details': item.items,
                        // Add more fields as needed
                    };
                })
            )
        );


        // Create a temporary file
        tmp.file((err, tempFilePath) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            // Write the Excel data to the temporary file
            fs.writeFileSync(tempFilePath, xls, 'binary');

            // Set response headers for downloading
            res.setHeader('Content-disposition', 'attachment; filename=data.xlsx');
            res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            // Stream the file to the client
            res.sendFile(tempFilePath, (err) => {
                // Remove the temporary file after it has been sent
                fs.unlinkSync(tempFilePath);
                if (err) {
                    console.error(err);
                    res.status(500).send('Internal Server Error');
                }
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
router.post('/allOrders/update-status/:id', async (req, res) => {
    console.log(req.params)
    var id = req.params.id
    //    const order = await orderModel.findOne({_id:req.params.id})
    const orders = await orderModel.find()
        .populate('userId', 'email')
        .populate('items.productId', 'name');
    var order = {};
    var items = []
    for (let index = 0; index < orders.length; index++) {
        const element = orders[index];
        if (element._id == id) {
            order = element
            items = element.items
        }
    }
    console.log(items)
    console.log("what")
    var details = ""
    for (let index = 0; index < order.items.length; index++) {
        const element = order.items[index];
        details += index + ") Product Name: " + element.productId.name + ", Quantity: " + element.quantity
        details += '\n'

    }
    if (order.status == 'pending') {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'aff.markssh@gmail.com',
                pass: 'zcdaufonyexxotnw'

            }
        });

        var mailOptions = {
            from: 'lart0242@gmail.com',
            to: order.userId.email,
            subject: 'Your Order Is Ready',
            text: `Your order is ready and awaiting pickup.
            Order Detail:
            ${details} `
        };

        transporter.sendMail(mailOptions, async function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);

                orderModel.findOneAndUpdate(
                    { _id: id }, // Condition to find the document
                    { $set: { status: "ready" } },       // Update data
                    { new: true }                // Return the updated document
                )
                    .then(updatedItem => {
                        console.log('Item updated successfully:', updatedItem);
                        res.status(201).json("success")
                    })
                    .catch(err => {
                        console.error('Error updating item:', err);
                    });

            }
        });
    }
    else {
        res.status(400).json({ status: "An email has been sent to this customer notifying him to pick up their items." })
    }
});
router.get('/revenue', requireAuthAdmin, async (req, res) => {
    try {
        var wineProducts = [];
        var alcoholProducts = [];
        var beerProducts = [];
        var accessoriesProducts = [];

        const monthlyRevenue = await orderModel.aggregate([
            {
                $project: {
                    month: { $month: '$order_date' }, // Extract month from order_date
                    total_amount: 1,
                },
            },
            {
                $group: {
                    _id: '$month',
                    totalRevenue: { $sum: '$total_amount' },
                },
            },
            {
                $sort: {
                    _id: 1,
                },
            },
        ]);
        var revenueData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        for (const monRev of monthlyRevenue) {
            revenueData[monRev._id - 1] = monRev.totalRevenue
        }
        const products = await productModel.find();
        for (let index = 0; index < products.length; index++) {
            const element = products[index];
            if (element.category == 'Wine') {
                wineProducts.push(element)
            }
            else if (element.category == 'Beer') {
                console.log(element)
                beerProducts.push(element)
            }
            else if (element.category == 'Alcohol') {
                alcoholProducts.push(element)
            }
            else if (element.category == 'Accessions') {
                accessoriesProducts.push(element)
            }
        }
        var accessoriesMostSold = getMostSoldProduct(accessoriesProducts)
        var wineMostSold = getMostSoldProduct(wineProducts)
        var beerMostSold = getMostSoldProduct(beerProducts)
        var alcoholMostSold = getMostSoldProduct(alcoholProducts)
        res.render('adminRevenue', { revenueData, alcoholMostSold, wineMostSold, beerMostSold, accessoriesMostSold })
    } catch (err) {
        console.error('Error:', err);
    }
});
function getMostSoldProduct(products) {
    if (!Array.isArray(products) || products.length === 0) {
        // Handle the case when the input is not a valid array or is empty
        return null;
    }
    // Initialize variables to keep track of the most sold product
    let mostSoldProduct = products[0]; // Assume the first product is the most sold
    let maxPurchaseQuantity = mostSoldProduct.purchaseQuantity || 0;

    // Iterate through the array to find the most sold product
    for (let i = 1; i < products.length; i++) {
        const currentProduct = products[i];
        const currentPurchaseQuantity = currentProduct.purchaseQuantity || 0;

        if (currentPurchaseQuantity > maxPurchaseQuantity) {
            // Update the most sold product if the current one has a higher purchase quantity
            mostSoldProduct = currentProduct;
            maxPurchaseQuantity = currentPurchaseQuantity;
        }
    }

    return mostSoldProduct;
}
router.get('/profile', requireAuthAdmin, async (req, res) => {
    try {
        res.render('adminProfile')
        // Optionally close the connection here if you're not using it elsewhere
    } catch (err) {
        console.error('Error:', err);
        // Optionally close the connection here if you're not using it elsewhere
    }
    // const orders = await orderModel.find()
});
module.exports = router