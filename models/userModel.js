const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

// Define the User Schema using Mongoose
const UserSchema = new mongoose.Schema({
  // User's username, required and must be unique
  username: {
    type: String,
    required: [true, "Please enter a username"],
    unique: true,
  },
  // User's first name, required
  firstname: {
    type: String,
    required: [true, "Please enter a firstname"],
  },
  // User's last name, required
  lastname: {
    type: String,
    required: [true, "Please enter a lastname"],
  },
  // User's email, required, unique, and must be a valid email format
  email: {
    type: String,
    required: [true, "Please enter an email"],
    unique: true,
    lowercase: true,
    validate: [isEmail, "Please enter a valid email"],
  },
  // User's phone number, required
  phoneNumber: {
    type: String,
    required: true,
  },
  // User's password, required
  password: {
    type: String,
    require: [true, "Please enter a password"],
  },
  // User's birthday, required
  birthday: {
    type: Date,
    required: true,
  },
  // Flag indicating whether the user is blocked, defaults to not blocked
  isBlocked: {
    type: Boolean,
    default: false,
  },
  // User's role, defaults to "normal", can be one of ["normal", "worker", "mainadmin"]
  role: {
    type: String,
    enum: ["normal", "worker", "mainadmin"],
    default: "normal",
  },
});

// Middleware: Execute this function before saving the document to the database
UserSchema.pre("save", async function (next) {
  if (this.password == null) {
    console.log("null");
    throw new Error("null");
  }

  // Encrypt the password using bcrypt with a cost factor of 11
  this.password = await bcrypt.hash(this.password, 11);

  // Continue with the saving process
  next();
});

// Create a Mongoose model named "user" based on the UserSchema
const UserModel = mongoose.model("user", UserSchema);

// Export the UserModel to be used in other parts of the application
module.exports = UserModel;
