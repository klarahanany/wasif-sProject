// Import required modules and packages
const Router = require("express"); // Express Router module
const express = require("express"); // Express framework
const router = Router(); // Create an instance of Express Router
const nodemailer = require("nodemailer"); // Nodemailer for sending emails
const bcrypt = require("bcrypt"); // Bcrypt for password hashing
const jwt = require("jsonwebtoken"); // JSON Web Token for authentication
const { render } = require("ejs"); // EJS templating engine
const { currentUser, requireAuthAdmin } = require("../middleware/authMiddware"); // Custom authentication middleware
const Review = require("../models/Review"); /// Review model
const productModel = require("../models/productModel.js"); // Product model
const userModel = require("../models/userModel.js"); // User model
const orderModel = require("../models/orderModel.js"); // Order model
const cartModel = require("../models/cartModel.js"); // Cart model
const multer = require("multer"); // Multer for handling file uploads
const path = require("path"); // Node.js path module
const json2xls = require("json2xls"); // JSON to Excel converter
const tmp = require("tmp"); // Temporary file and directory creator
const fs = require("fs"); // File system module
const xlsx = require("xlsx"); // Excel file reader/writer

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public"); // Specify the directory where files should be saved
  },
  filename: function (req, file, cb) {
    // Use the original name of the file
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
const maxAge = 3 * 24 * 60 * 60;

// Function to create a JWT token with user id
const createToken = (id) => {
  return jwt.sign({ id }, "mysecretcode", {
    expiresIn: maxAge, // 3 days
  });
};

// Function to handle authentication errors
const handleErrors = (err) => {
  let errors = { username: "", password: "" };

  // Incorrect user/admin
  if (err === "incorrect username") {
    errors.username = "You are Not an Admin";
  }

  // Incorrect password admin
  if (err == "incorrect password") {
    errors.password = "Incorrect Password";
  }

  // Validation errors
  else if (err === "user validation failed") {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

// Function to handle registration errors
const handleErrors2 = (err, usernameValue, emailValue) => {
  // Initialize an object to store error messages for each field
  let errors = { username: "", email: "", password: "" };

  // Duplicate username error
  if (
    err.message === `E11000 duplicate key error collection: SpiritualDrinksShop.users index: username_1 dup key: { username: "${usernameValue}" }`
  ) {
    errors.username = "This Username is Already Registered";
    return errors;
  }

  // Duplicate email error
  if (err.message === `E11000 duplicate key error collection: SpiritualDrinksShop.users index: email_1 dup key: { email: "${emailValue}" }`) {
    errors.email = "This Email is Already Registered";
    return errors;
  }

  // Validation errors
  else if (err === "user validation failed") {
    // Extract validation errors and populate the 'errors' object
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
};

// Route to handle admin logout
router.get("/logout", async (req, res) => {
  // Clear the jwtAdmin cookie by replacing it with an empty string
  res.cookie("jwtAdmin", "", { maxAge: 1 });

  // Redirect to the admin login page after logout
  res.redirect("/admin");
});

// Route to handle admin login errors
router.get("/loginErrorAdmin", (req, res) => {
  // Render the 'loginErrorAdmin' view to display login errors
  res.render("loginErrorAdmin");
});

// Route to display admin reviews (requires admin authentication)
router.get("/reviews", requireAuthAdmin, async (req, res) => {
  try {
    // Fetch all reviews from the database
    const reviews = await Review.find({});

    // Render the 'adminReviews' view and pass the reviews data to the view
    res.render("adminReviews", { reviews });
  } catch (err) {
    // Handle any potential errors (e.g., database errors)
    console.error("Error:", err);
  }
});

// Route to delete a review item
router.post("/reviews/deleteItem", async (req, res) => {
  // Extract the ReviewId from the request body
  const ReviewId = req.body.ReviewId;

  try {
    // Attempt to find and remove the review item by its ID
    const removedItem = await Review.findByIdAndRemove(ReviewId);

    if (removedItem) {
      // If the item is found and removed successfully
      console.log(`Item with ID ${ReviewId} removed successfully.`);
      res.json("DONE");
    } else {
      // If the item with the specified ID is not found
      console.log(`Item with ID ${ReviewId} not found.`);
    }
  } catch (err) {
    // Handle any potential errors (e.g., database errors)
    console.error(err);
  }
});

// Route to display admin login page
router.get("/", (req, res) => {
  res.render("adminLogin");
});

// Route to handle admin login
router.post("/", async (req, res) => {
  // Extract username and password from the request body
  const username = req.body.username;
  const password = req.body.password;

  try {
    // Find a user in the database with the provided username
    const user = await userModel.findOne({ username });

    // Check if the user exists and has the role of "worker" or "mainadmin"
    if (user && (user.role == "worker" || user.role == "mainadmin")) {
      // Compare the provided password with the hashed password stored in the database
      const auth = await bcrypt.compare(password, user.password);

      if (auth) {
        //If password is correct after comparing
        const token = createToken(user._id);
        console.log(token);

        // Sending the token as a cookie to the frontend
        res.cookie("jwtAdmin", token, { httpOnly: true, maxAge: maxAge * 1000 });

        // Send a success response with the user's ID to the frontend
        res.status(201).json({ user: user._id });
      } else {
        const error = handleErrors("incorrect password");
        console.log(error);
        res.status(400).json({ error });
      }
    } else {
      const error = handleErrors("incorrect username");
      console.log(error);
      res.status(400).json({ error });
    }
  } catch (e) {
    const error = handleErrors(e);
    console.log(error);
    res.status(400).json({ error });
  }
});

// Route to display admin inventory (requires admin authentication)
router.get("/inventory", requireAuthAdmin, async (req, res) => {
  // Initialize an empty array to store options for a dropdown menu
  const options = [];
  // Fetch all products from the database and sort them by quantity
  const products = await productModel.find().sort({ quantity: 1 });

  // Loop through each product to create options for the dropdown menu
  for (let index = 0; index < products.length; index++) {
    const element = { value: products[index].name, label: products[index].name };
    options.push(element);
  }

  // Render the adminInventory view with the fetched products and options
  res.render("adminInventory", { products, options });
});

// Add the route to download data as Excel
router.get("/inventory/downloadProductsData", async (req, res) => {
  try {
    // Fetch data from MongoDB
    const data = await productModel.find({});

    // Convert specific fields to Excel format
    const xls = json2xls(
      data.map((item) => {
        return {
          // Include the specific fields you want in the Excel file
          image: item.image,
          name: item.name,
          description: item.description,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
        };
      })
    );

    // Create a temporary file
    tmp.file((err, tempFilePath) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

      // Write the Excel data to the temporary file
      fs.writeFileSync(tempFilePath, xls, "binary");

      // Set response headers for downloading
      res.setHeader("Content-disposition", "attachment; filename=data.xlsx");
      res.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

      // Stream the file to the client
      res.sendFile(tempFilePath, (err) => {
        // Remove the temporary file after it has been sent
        fs.unlinkSync(tempFilePath);
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to update product information
router.post("/inventory/update-product", upload.single("image"), async (req, res) => {
  // Log the request body for debugging purposes
  console.log(req.body);

  // Destructure request body for required fields
  const { selectName, description, price, quantity, selectOption } = req.body;

  // Check if a new image file is provided
  if (req.file) {
    // If an image file is provided, update the product with the new image
    productModel
      .findOneAndUpdate(
        { name: selectName },
        { description: description, price: price, category: selectOption, quantity: quantity, image: req.file.filename },
        { new: true, useFindAndModify: false }
      )
      .then((updatedProduct) => {
        console.log("Updated Product:", updatedProduct);
      })
      .catch((err) => {
        console.error("Error updating document:", err);
      });

    // Send a JSON response indicating the update is done
    res.json("done");
  } else {
    // If no new image file is provided, update the product without changing the image
    productModel
      .findOneAndUpdate(
        { name: selectName },
        { description: description, price: price, category: selectOption, quantity: quantity },
        { new: true, useFindAndModify: false }
      )
      .then((updatedProduct) => {
        console.log("Updated Product:", updatedProduct);
      })
      .catch((err) => {
        console.error("Error updating document:", err);
      });

    // Send a JSON response indicating the update is done
    res.json("done");
  }
});

// Route to get updated product changes
router.post("/inventory/update-product/changes", async (req, res) => {
  // Log the request body for debugging purposes
  console.log(req.body);
  // Fetch all existing products from the database
  const products = await productModel.find();
  // Send the list of products as a JSON response
  res.json({ products: products });
});

// Route to delete a product
router.post("/inventory/delete-product", async (req, res) => {
  // Destructure the product name from the request body
  const { selectedValue } = req.body;

  try {
    // Find and delete the product document based on the provided name
    const deletedDocument = await productModel.findOneAndDelete({ name: selectedValue });

    // Check if the product document was not found
    if (!deletedDocument) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Send a success response if the product is deleted
    res.json("done");
  } catch (error) {
    // Handle errors, log them, and send an internal server error response
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to add a new product
router.post("/inventory/add-product", upload.single("image"), async (req, res) => {
  // Initialize a flag to check if the product name already exists
  var flag = 0;
  // Destructure request body for required fields
  const { newProductName, description, selectOption, price, quantity } = req.body;
  // Fetch all existing products from the database
  const products = await productModel.find();

  // Check if the new product name already exists in the database
  for (let index = 0; index < products.length; index++) {
    const currentName = products[index].name;

    if (newProductName === currentName) {
      // Set the flag to indicate that the product name already exists
      flag = 1;
      // Send an error response if the product name already exists
      res.status(400).json({ error: "product name already exist" });
    }
  }

  // If the product name is unique, proceed with validation and saving
  if (flag == 0) {
    // Check if the selected category is valid
    if (selectOption == "selectCategory") {
      res.status(400).json({ error: "please select category" });
    } else if (price <= 0) {
      // Check if the entered price is valid
      res.status(400).json({ error: "enter valid price" });
    } else if (quantity < 0) {
      // Check if the entered quantity is valid
      res.status(400).json({ error: "please choose relevante quantity" });
    } else {
      const newProduct = new productModel({
        image: req.file.filename,
        name: newProductName,
        description: description,
        price: price,
        quantity: quantity,
        category: selectOption,
      });

      // Save the new product to the database
      newProduct
        .save()
        .then(() => {
          console.log("Product saved successfully.");
          // Send a success response if the product is added successfully
          res.status(201).json({ status: "product has been added" });
        })
        .catch((error) => {
          console.error("Error saving product:", error);
        });
    }
  }
});

// Route to manage users (requires admin authentication)
router.get("/usermanagment", requireAuthAdmin, async (req, res) => {
  // Get the admin information from the response locals
  const admin = res.locals.admin;

  // Check if the admin is a main admin
  if (admin.role == "mainadmin") {
    // If main admin, fetch all users with roles "worker" and "normal"
    const users = await userModel.find({ role: { $in: ["worker", "normal"] } });

    // Render the adminUserManagment view with the fetched users
    res.render("adminUserManagment", { users });
  } else if (admin.role == "worker") {
    // If worker admin, fetch users with role "normal" only
    const users = await userModel.find({ role: { $in: ["normal"] } });

    // Render the adminUserManagment view with the fetched users
    res.render("adminUserManagment", { users });
  }
});

// Route to download user data as Excel
router.get("/usermanagment/downloadUserData", async (req, res) => {
  try {
    // Fetch data from MongoDB
    const data = await userModel.find({ role: { $in: ["normal", "worker"] } });

    // Convert specific fields to Excel format
    const xls = json2xls(
      data.map((item) => {
        // Determine user status (Blocked or Active) based on isBlocked field
        var isBlocked = item.isBlocked ? "Blocked" : "Active";

        return {
          // Include the specific fields you want in the Excel file
          Username: item.username,
          "First Name": item.firstname,
          "Last Name": item.lastname,
          "Birth Date": item.birthday,
          Status: isBlocked,
          Role: item.role,
        };
      })
    );

    // Create a temporary file
    tmp.file((err, tempFilePath) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

      // Write the Excel data to the temporary file
      fs.writeFileSync(tempFilePath, xls, "binary");

      // Set response headers for downloading
      res.setHeader("Content-disposition", "attachment; filename=data.xlsx");
      res.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

      // Stream the file to the client
      res.sendFile(tempFilePath, (err) => {
        // Remove the temporary file after it has been sent
        fs.unlinkSync(tempFilePath);
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to block/unblock a user
router.post("/usermanagment/block-user/:userId", async (req, res) => {
  // Extract userId from request parameters
  const userId = req.params.userId;
  console.log(userId);

  try {
    // Fetch the user from the database based on the userId
    const user = await userModel.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Toggle the isBlocked status
    user.isBlocked = !user.isBlocked;

    // Save the updated user back to the database
    await user.save();

    // Redirect or send a response as needed
    res.redirect("/admin/usermanagment"); // Redirect back to the user management page
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to add a new admin user
router.post("/usermanagment/addadmin", async (req, res) => {
  // Extract user details from the request body
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const birthday = req.body.birthday;
  const phoneNumber = req.body.phoneNumber;

  try {
    console.log(phoneNumber);

    // Create a new user document in the database
    const user = await userModel.create({ username, email, password, firstname, lastname, birthday, phoneNumber, role: "worker" });
    console.log(phoneNumber);

    // Create a nodemailer transporter for sending emails
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "spiritualdrinks.shop@gmail.com",
        pass: "vnwd jpxa ztkj cpkh",
      },
    });

    // Define mail options for sending a welcome email to the user
    var mailOptions = {
      from: "spiritualdrinks.shop@gmail.com",
      to: email,
      subject: "adding worker",
      text: `you have an account now as an worker,
            username: ${username}
            password: ${password}
            login here: http://localhost:3000/admin
            and please change your password in your profile`,
    };

    // Use the transporter to send the email
    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    // Send a JSON response indicating success
    res.status(201).json("done"); // Send back to frontend as json body
  } catch (e) {
    // Handle errors and send an appropriate error response
    const error = handleErrors2(e, username, email);
    console.log(error);
    res.status(400).json({ error });
  }
});

// Route to delete an admin user
router.post("/usermanagment/deleteadmin", async (req, res) => {
  // Log the request body to the console
  console.log(req.body);
  // Extract the username from the request body
  const username = req.body.username;

  try {
    // Define a condition to identify the user you want to delete
    const condition = { username: username };

    // Use findOne to retrieve the user's email before deletion
    const user = await userModel.findOne({ username: username });
    // Use deleteOne to delete a single document that matches the condition
    const result = await userModel.deleteOne(condition);

    console.log("User deleted successfully");

    // Create a nodemailer transporter for sending emails
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "spiritualdrinks.shop@gmail.com",
        pass: "vnwd jpxa ztkj cpkh",
      },
    });

    // Define mail options for sending an email to the user
    var mailOptions = {
      from: "spiritualdrinks.shop@gmail.com",
      to: user.email,
      subject: "Deleting Worker",
      text: `Your account has been deactivated. You no longer have administrator privileges.`,
    };

    // Use the transporter to send the email
    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    // Send a JSON response indicating success
    res.status(201).json("done");
  } catch (error) {
    // Log an error message if an error occurs during the process
    console.error("Error deleting user:", error);
  }
});

// Route to view all orders
router.get("/allOrders", requireAuthAdmin, async (req, res) => {
  try {
    // Fetch all orders from the orderModel, populating user and product details
    const orders = await orderModel.find({}).populate("userId", "username phoneNumber").populate("items.productId", "name");

    // Render the adminAllOrders view and pass the orders data to the view
    res.render("adminAllOrders", { orders });
    // Optionally close the connection here if you're not using it elsewhere
  } catch (err) {
    // Handle errors if any occur during the process
    console.error("Error:", err);
    // Optionally close the connection here if you're not using it elsewhere
  }
});

// Route to download all orders data as Excel
router.get("/allOrders/downloadOrdersData", async (req, res) => {
  try {
    // Fetch data from MongoDB
    const data = await orderModel.find({});

    // Convert specific fields to Excel format
    const xls = json2xls(
      await Promise.all(
        data.map(async (item) => {
          const userdata = await userModel.findOne({ _id: item.userId });
          console.log(userdata);

          // Return an object with specific fields for Excel file
          return {
            "Order Date": item.order_date,
            username: userdata.username,
            "Total Amount": item.total_amount,
            "Payment Method": item.payment.payment_method,
            "Order Details": item.items,
          };
        })
      )
    );

    // Create a temporary file using the tmp library
    tmp.file((err, tempFilePath) => {
      if (err) {
        // Handle error if creating temporary file fails
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

      // Write the Excel data to the temporary file
      fs.writeFileSync(tempFilePath, xls, "binary");

      // Set response headers for downloading
      res.setHeader("Content-disposition", "attachment; filename=data.xlsx");
      res.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

      // Stream the file to the client
      res.sendFile(tempFilePath, (err) => {
        // Remove the temporary file after it has been sent
        fs.unlinkSync(tempFilePath);
        if (err) {
          // Handle error if streaming file to client fails
          console.error(err);
          res.status(500).send("Internal Server Error");
        }
      });
    });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to update order status
router.post("/allOrders/update-status/:id", async (req, res) => {
  // Log the parameters received in the request
  console.log(req.params);
  // Extract the order ID from the request parameters
  var id = req.params.id;

  // Fetch all orders from the database and populate user and product information
  const orders = await orderModel.find().populate("userId", "email").populate("items.productId", "name");

  // Initialize variables to store the specific order and its items
  var order = {};
  var items = [];

  // Iterate through orders to find the one with the specified ID
  for (let index = 0; index < orders.length; index++) {
    const element = orders[index];

    if (element._id == id) {
      // Found the matching order
      order = element;
      items = element.items;
    }
  }

  // Log the items in the order for debugging
  console.log(items);

  // Generate a string with details of each item in the order
  var details = "";
  for (let index = 0; index < order.items.length; index++) {
    const element = order.items[index];
    var num = index + 1;
    details += num + ") Product name: " + element.productId.name + ", Quantity: " + element.quantity + "\n";
  }

  // Check if the order status is "pending"
  if (order.status == "pending") {
    // Set up nodemailer transporter with Gmail credentials
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "spiritualdrinks.shop@gmail.com",
        pass: "vnwd jpxa ztkj cpkh",
      },
    });

    // Configure email options
    var mailOptions = {
      from: "spiritualdrinks.shop@gmail.com",
      to: order.userId.email,
      subject: "Order Ready",
      text: `Your order is ready and awaiting pickup\nOrder Detail:\n${details} `,
    };

    // Send the email to the customer
    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        // Log any errors that occurred during email sending
        console.log(error);
      } else {
        // Log the success message and update the order status to "ready" in the database
        console.log("Email sent: " + info.response);

        orderModel
          .findOneAndUpdate(
            { _id: id }, // Condition to find the document
            { $set: { status: "ready" } }, // Update data
            { new: true } // Return the updated document
          )
          .then((updatedItem) => {
            // Log the success message and send a JSON response indicating success
            console.log("Item updated successfully:", updatedItem);
            res.status(201).json("success");
          })
          .catch((err) => {
            // Log any errors that occurred during the update process
            console.error("Error updating item:", err);
          });
      }
    });
  } else {
    // If the order status is not "pending", send a JSON response with a message
    res.status(400).json({ status: "An email has been sent to this customer notifying him to pick up their items." });
  }
});

router.get("/revenue", requireAuthAdmin, async (req, res) => {
  try {
    var wineProducts = [];
    var alcoholProducts = [];
    var beerProducts = [];
    var accessoriesProducts = [];

    const monthlyRevenue = await orderModel.aggregate([
      {
        $project: {
          month: { $month: "$order_date" }, // Extract month from order_date
          total_amount: 1,
        },
      },
      {
        $group: {
          _id: "$month",
          totalRevenue: { $sum: "$total_amount" },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    var revenueData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (const monRev of monthlyRevenue) {
      revenueData[monRev._id - 1] = monRev.totalRevenue;
    }

    const products = await productModel.find();

    for (let index = 0; index < products.length; index++) {
      const element = products[index];
      if (element.category == "Wine") {
        wineProducts.push(element);
      } else if (element.category == "Beer") {
        console.log(element);
        beerProducts.push(element);
      } else if (element.category == "Alcohol") {
        alcoholProducts.push(element);
      } else if (element.category == "Accessories") {
        accessoriesProducts.push(element);
      }
    }
    var accessoriesMostSold = getMostSoldProduct(accessoriesProducts);
    var wineMostSold = getMostSoldProduct(wineProducts);
    var beerMostSold = getMostSoldProduct(beerProducts);
    var alcoholMostSold = getMostSoldProduct(alcoholProducts);
    res.render("adminRevenue", { revenueData, alcoholMostSold, wineMostSold, beerMostSold, accessoriesMostSold });
  } catch (err) {
    console.error("Error:", err);
  }
});

function getMostSoldProduct(products) {
  // Check if the input is a valid array and not empty
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

    // Compare the purchase quantity of the current product with the maximum
    if (currentPurchaseQuantity > maxPurchaseQuantity) {
      // Update the most sold product if the current one has a higher purchase quantity
      mostSoldProduct = currentProduct;
      maxPurchaseQuantity = currentPurchaseQuantity;
    }
  }
  return mostSoldProduct;
}

// Route to render the admin profile page
router.get("/profile", requireAuthAdmin, async (req, res) => {
  try {
    // Render the "adminProfile" view
    res.render("adminProfile");
    // Optionally close the connection here if you're not using it elsewhere
  } catch (err) {
    console.error("Error:", err);
  }
});

// Export the router for use in the main application
module.exports = router;
