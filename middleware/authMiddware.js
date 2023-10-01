const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')

//verifying the token for any route we choose to protect
const requireAuth = (req,res,next)=>{
    const token = req.cookies.jwt//get the token from cookie (if user is already signed)
    //check jwt exists and is verified
    if(token){
        jwt.verify(token,'mysecretcode', (err, decodedToken)=>{
            if(err){//if we have token but not valid
                console.log(err.message)
                res.redirect('/login')
            }else{//is valid user
                console.log(decodedToken)
                next()
            }
        })
    }else{ //the user isn't logged in
        res.redirect('/loginError')
        res.status(400).end()
    }

}

//check current user
const currentUser =  (req,res,next) => {
    const token = req.cookies.jwt//get the token from cookie (if user is already signed)
    //check jwt exists and is verified
    if(token) {
        //verify the token and then u get decoded token on callback function which has in it
        //saved user id
        jwt.verify(token,'mysecretcode', async (err, decodedToken) => {
            if (err) {//if we have token but not valid
                console.log(err.message)
                res.locals.user= null
                next()
            } else {//is valid user
                console.log(decodedToken)
                res.locals.user =await userModel.findById(decodedToken.id)
                next()
            }
        })
    }else{
        res.locals.user = null
        next()
    }
}

module.exports = {requireAuth, currentUser}