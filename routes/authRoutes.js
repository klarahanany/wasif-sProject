const Router = require("express");
const router = Router();
const authController = require("../controllers/authController");
require("dotenv").config();
const userModel = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { render } = require("ejs");
const maxAge = 3 * 24 * 60 * 60;
//takes user id from database
const createToken = (id) => {
  //save user id in the token
  return jwt.sign({ id }, "mysecretcode", {
    expiresIn: maxAge, // 3 days
  });
};

function isOver21(birthdate) {
  // Parse the birthdate string into a Date object
  const birthDateObject = new Date(birthdate);

  // Get the current date
  const currentDate = new Date();
  // Calculate the age
  const age = currentDate.getFullYear() - birthDateObject.getFullYear();
  // Check if the birthday has occurred for this year
  const hasBirthdayOccurred =
    currentDate.getMonth() > birthDateObject.getMonth() ||
    (currentDate.getMonth() === birthDateObject.getMonth() && currentDate.getDate() >= birthDateObject.getDate());
  // If the birthday has not occurred yet, subtract 1 from the age
  const finalAge = hasBirthdayOccurred ? age : age - 1;
  // Check if the age is greater than or equal to 21
  return finalAge >= 21;
}
// Error handler
const handleErrors = (err, usernameValue, emailValue) => {
  let errors = { username: "", email: "", password: "" };

  // Incorrect username
  if (err === "incorrect username") {
    errors.username = "Username is Not Registered";
  }
  // Incorrect password
  if (err == "incorrect password") {
    errors.password = "Incorrect Password";
  }
  // Incorrect email
  if (err.message === "incorrect email") {
    errors.email = "mail is not registered";
  }
  // Duplicate username error
  if (
    err.message === `E11000 duplicate key error collection: SpiritualDrinksShop.users index: username_1 dup key: { username: "${usernameValue}" }`
  ) {
    errors.username = "This Username is Already Registered";
    return errors;
  }
  //
  if (err.message === `E11000 duplicate key error collection: SpiritualDrinksShop.users index: email_1 dup key: { email: "${emailValue}" }`) {
    errors.email = "This Email is Already Registered";
    return errors;
  }
  // Validation errors
  else if (err === "user validation failed") {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};
router.get("/signup", (req, res) => {
  res.render("signup");
});
router.get("/forgotPass", (req, res) => {
  res.render("forgetPass", { status: "" });
});

router.post("/signup", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const birthday = req.body.birthday;
  const phoneNumber = req.body.phone;

  try {
    if (isOver21(birthday) == true) {
      console.log(password);
      const user = await userModel.create({ username, email, password, firstname, lastname, birthday, phoneNumber });
      const token = createToken(user._id);
      res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
      res.status(201).json({ user: user._id }); // send back to frontend as json body
    } else {
      res.status(400).json({ status: "You are Underage" });
    }
  } catch (e) {
    const error = handleErrors(e, username, email);
    console.log(error);
    res.status(400).json({ error });
  }
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  try {
    const user = await userModel.findOne({ username });
    if (user && user.role == "normal") {
      if (user.isBlocked == false) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
          //if password is correct after comparing
          const token = createToken(user._id);
          //sending the token as a cookie to frontend
          res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
          res.status(201).json({ user: user._id }); // send back to frontend as json body
        } else {
          const error = handleErrors("incorrect password");
          res.status(400).json({ error });
        }
      } else {
        const errorBlocked = "errorBlocked";
        res.status(400).json({ errorBlocked });
      }
    } else {
      //if user exists in db
      const error = handleErrors("incorrect username");
      console.log(error);
      res.status(400).json({ error });
    }
  } catch (e) {
    const error = handleErrors(e);
    res.status(400).json({ error });
  }
});

router.get("/logout", async (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 }); //replace the current cookie with empty string
  res.redirect("/");
});

router.get("/loginError", (req, res) => {
  res.render("loginError");
});
router.post("/forgotPass", async (req, res) => {
  const email = req.body.email;
  try {
    const User = await userModel.findOne({ email });
    if (!User) {
      res.render("forgetPass", { status: "User Not Exists!!", user: undefined });
    }

    const secret = process.env.SECRET_CODE + User.password;
    const token = await jwt.sign({ email: User.email, id: User._id }, secret, { expiresIn: "50m" });
    const link = `http://localhost:3000/resetPass/${User._id}/${token}`;
    console.log(link);

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "spiritualdrinks.shop@gmail.com",
        pass: "vnwd jpxa ztkj cpkh",
      },
    });

    var mailOptions = {
      from: "lart0242@gmail.com",
      to: email,
      subject: "Reset Password",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        res.render("forgetPass", { status: "check your email to reset your password", user: undefined });
      }
    });
  } catch (err) {
    console.log(err);
  }
});
router.get("/resetPass/:id/:token", async (req, res) => {
  const { id, token } = req.params;

  const oldUser = await userModel.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = process.env.SECRET_CODE + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    res.render("resetPass", { email: verify.email, status: "Not Verified", user: id });
  } catch (err) {
    console.log(err);
  }

  // res.send(req.params)
});
router.post("/resetPass/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password, confirmpassword } = req.body;
  const oldUser = await userModel.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = process.env.SECRET_CODE + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    if (password === confirmpassword) {
      const encryptedPassword = await bcrypt.hash(password, 10);
      await userModel.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            password: encryptedPassword,
          },
        }
      );
      res.render("resetPass", { email: verify.email, status: "verified", user: undefined });
    } else {
      res.render("resetPass", { email: verify.email, status: "error", user: undefined });
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
