const Router = require('express')
const router = Router()
const userModel = require('../models/userModel.js')
const { requireAuth } = require("../middleware/authMiddware");
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');

router.get('/', requireAuth, async (req, res) => {
    // Assuming that res.locals.user contains the authenticated user's information
    const user = res.locals.user;

    try {
        // You don't need to find the user again since you already have their data
        // Simply pass 'user' to the 'profile' view
        res.render('profile', { user });
    } catch (error) {
        // Handle any potential errors here
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
router.post('/', async (req, res) => {
    const { username, password, firstname, lastName, birthday, email,phoneNumber } = req.body
    const currentuser = await userModel.findOne({username:username})
    var id =currentuser._id;
    const user = await userModel.findOne({email:email,_id: { $ne: id} })
    if(user){
        res.status(400).json({ status: 'emailAlreadyExist' })
    }
    else if (password == '') {
        try {
            userModel.findOneAndUpdate(
                { username: username },
                { email: email, firstname: firstname, lastname: lastName, birthday: birthday,phoneNumber:phoneNumber },
                { new: true, useFindAndModify: false }
            )
                .then(updatedProduct => {
                    // Log the updated product
                    console.log('Updated user:', updatedProduct);
                })
                .catch(err => {
                    console.error('Error updating document:', err);
                })
            res.status(201).json({ status: 'done' })
        }
        catch (err) {
            console.log(err)
        }
    }
    else {
        try {
            const salt = bcrypt.genSaltSync(10);
            // Hash the password with the salt
            const hashedPassword = bcrypt.hashSync(password, salt);
            userModel.findOneAndUpdate(
                { username: username },
                { email: email, firstname: firstname, lastname: lastName, birthday: birthday, password: hashedPassword },
                { new: true, useFindAndModify: false }
            )
                .then(updatedProduct => {
                    // Log the updated product
                    console.log('Updated user:', updatedProduct);
                })
                .catch(err => {
                    console.error('Error updating document:', err);
                })
            res.status(201).json({ status: 'done' })
        }
        catch (err) {
            console.log(err)
        }
    }
})
router.post('/removeaccount', async (req, res) => {
    const { username} = req.body
 
        try {
            userModel.findOneAndUpdate(
                { username: username },
                {isBlocked:true },
                { new: true, useFindAndModify: false }
            )
                .then(updatedProduct => {
                    // Log the updated product
                    console.log('blocked user:', updatedProduct);
                    res.cookie('jwt', '', { maxAge: 1 }) //replace the current cookie with empty string
                    res.status(201).json({ status: 'done' })

                })
                .catch(err => {
                    console.error('Error updating document:', err);
                })
        }
        catch (err) {
            console.log(err)
        }
    
})
module.exports = router;
