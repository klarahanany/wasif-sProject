const mongoose = require('mongoose')
const {isEmail} = require('validator')
const bcrypt  = require('bcrypt')
const UserSchema = new mongoose.Schema({
    username : {
        type: String,
        required: [true, 'Please enter a username'],
        unique: true
    },

    email : {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase :true,
        validate : [isEmail, 'Please enter a valid email']
    },
    password : {
        type : String,
        require : [true, 'Please enter a password']
    },
})

// call the function before doc saved to database (instance already created tho)

UserSchema.pre('save', async function (next){

    if(this.password == null) {
        console.log("null")
      throw new Error('null')
    }
    this.password = await bcrypt.hash(this.password,11)  //this.password refers to the instance of current user pass

    next()
})

const UserModel= mongoose.model('user', UserSchema)

module.exports = UserModel