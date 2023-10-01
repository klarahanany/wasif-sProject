

const userModel = require('../models/userModel.js')
const bcrypt  = require('bcrypt')
const jwt = require('jsonwebtoken')
// handle errors
const handleErrors = (err) => {


    console.log(err)

    let errors = { username: '', email: '', password: '' };

    //incorrect email
    if (err === 'incorrect username') {
        errors.username = 'that username is not registered'
    }

    //incorrect email
    if (err.message === 'incorrect email') {
        errors.email = 'that mail is not registered'
    }
    // duplicate email error
    if (err.code === 11000) {
        errors.email = 'that email is already registered';
        return errors;
    }

    // validation errors
    else if (err === 'user validation failed') {
        // console.log(err);
        Object.values(err.errors).forEach(({ properties }) => {
            // console.log(val);
            // console.log(properties);
            errors[properties.path] = properties.message;
        });
    }

    return errors;
}
const signup_get = (req, res) => {
    res.render('signup')
}
const login_get = (req, res) => { //to display the UI
    res.render('login')
} 
const adminLogin_get = (req, res) => { //to display the UI
    res.render('adminLogin')
} 

const signup_post = async (req,res) =>{
    const username  = req.body.username
    const email = req.body.email
    const password = req.body.password
   try{

       const user = await userModel.create({username,email,password});
        const token = createToken(user._id)
       //sending the token as a cookie to frontend
       res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
       res.status(201).json({user: user._id}) // send back to frontend as json body
       console.log(`${username} created`)
   }catch (e) {
      const error = handleErrors(e)
       res.status(400).json({ error });
   }
}

const login_post = async (req,res) =>{
    const username  = req.body.username
    const password = req.body.password
    try{
        const user = await userModel.findOne({username})
        if(user){
            const auth =  await bcrypt.compare(password, user.password)
            if(auth){ //if password is correct after comparing
                const token = createToken(user._id)
                //sending the token as a cookie to frontend
                res.cookie('jwt',token, {httpOnly: true, maxAge: maxAge*1000})
                res.status(201).json({user: user._id}) // send back to frontend as json body

            }

        } else{ //if user exists in db
            const error = handleErrors('incorrect username')
            console.log(error)
            res.status(400).json({error})
        }
    } catch (e) {
        const error = handleErrors(e)
        res.status(400).json({ error })
    }

}


const maxAge = 3 * 24 * 60 * 60;
//takes user id from database
const createToken = (id)=>{
        //save user id in the token
    return jwt.sign({id}, 'mysecretcode', {
        expiresIn: maxAge // 3 days
    })
}


const logout_get = async (req, res) => {
    res.cookie('jwt', '', { maxAge: 1 }) //replace the current cookie with empty string
    res.redirect('/')

}
module.exports = {signup_get,signup_post,login_post,login_get,logout_get,adminLogin_get}
