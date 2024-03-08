const Router = require("express");
const router = Router();
const nodemailer = require("nodemailer");
const cartModel = require("../models/cartModel.js");
const orderModel = require("../models/orderModel.js");
const productModel = require("../models/productModel.js");
const UserModel = require("../models/userModel.js");
const { render } = require("ejs");
const { currentUser, requireAuth } = require("../middleware/authMiddware");

function calculateTotal(cartItems) {
  var total = cartItems.reduce((total, item) => {
    // Check a condition before adding to the total
    if (item.allQuantity > 0) {
      // Only add to the total if the quantity is greater than 0
      total += item.price * item.quantity;
    }

    return total;
  }, 0);
  return total.toFixed(2);
}

// Route to render the main order page
router.get("/", requireAuth, async (req, res) => {
  const user = res.locals.user;
  var userId = user._id;
  const drinks = await productModel.find();
  const category = "all";
  res.render("orderNow", { drinks, userId, category });
});

// Route to render the order page based on the selected category
router.get("/category/:category", requireAuth, async (req, res) => {
  const user = res.locals.user;
  var userId = user._id;
  const drinks = await productModel.find();
  const category = req.params.category;
  res.render("orderNow", { drinks, userId, category });
});

// Route to render a specific product page
router.get("/product/:id", requireAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await productModel.findOne({ _id: productId });
    const user = res.locals.user;
    var userId = user._id;
    res.render("displayOneProduct", { product, userId });
  } catch (error) {
    console.error("Error rendering page:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route to handle adding items to the cart
router.post("/add-to-cart", async (req, res) => {
  const productId = req.body.drinkId.trim();
  const quantity = req.body.quantity;
  const userId = req.body.userId.trim();

  try {
    // Find the user's cart by user ID
    let cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
      // Create a new cart if one doesn't exist for the user
      cart = new cartModel({
        userId: userId,
        items: [],
      });
    }

    // Add the new item to the cart's items array
    var productIndex = -1;
    productIndex = cart.items.findIndex((item) => item.productId.equals(productId));
    if (productIndex !== -1) {
      cart.items[productIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({
        productId,
        quantity,
      });
    }

    // Save the cart with the new item
    const updatedCart = await cart.save();
  } catch (err) {
    // Handle any errors
    console.error(err);
  }

  res.json("done");
});

// Route to render the cart page
router.get("/cart", requireAuth, async (req, res) => {
  const user = res.locals.user;
  const products = await productModel.find();
  var userId = user._id;
  const currentUserCart = await cartModel.findOne({ userId: user._id });
  var cartItems = [];

  if (currentUserCart) {
    var cartData = currentUserCart.items;

    cartData.forEach((item) => {
      products.forEach((product) => {
        if (item.productId.equals(product._id)) {
          if (item.quantity > product.quantity) {
            item.quantity = product.quantity;

            // Update the cart with the adjusted quantity
            cartModel
              .findOneAndUpdate({ userId: user._id }, { $set: { items: cartData } }, { new: true })
              .then((updatedProduct) => {
                if (updatedProduct) {
                  console.log("Product updated successfully:", updatedProduct);
                } else {
                  console.log("Product not found");
                }
              })
              .catch((error) => {
                console.error("Error updating product:", error);
              });

            // Add the item to the cartItems array with adjusted quantity
            cartItems.push({
              productId: product._id,
              name: product.name,
              price: product.price,
              quantity: product.quantity,
              image: product.image,
              allQuantity: product.quantity,
            });
          } else {
            // Add the item to the cartItems array with the original quantity
            cartItems.push({
              productId: product._id,
              name: product.name,
              price: product.price,
              quantity: item.quantity,
              image: product.image,
              allQuantity: product.quantity,
            });
          }
        }
      });
    });
  }

  var total = calculateTotal(cartItems);
  res.render("cart", { cartItems, total, userId });
});

// Route to handle deleting an item from the cart
router.post("/cart/deleteItem", async (req, res) => {
  var productId = req.body.itemID;
  var userId = req.body.userId;

  try {
    let cart = await cartModel.findOne({ userId: userId });
    const updatedCartItems = cart.items;
    var newArray = updatedCartItems.filter((item) => item.productId != productId);

    // Update cart in the database with the new items array
    cartModel
      .updateOne({ userId: userId }, { $set: { items: newArray } })
      .then((result) => {
        console.log("Successfully updated items:", result);
      })
      .catch((error) => {
        console.log("Error updating items:", error);
      });

    res.json("Done");
  } catch (err) {
    // Handle any errors
    console.error(err);
  }
});

// Route to handle changing the quantity of an item in the cart
router.post("/cart/changeQuan", async (req, res) => {
  var productId = req.body.productId;
  var newQuantity = req.body.newQuan;
  var userId = req.body.userId;
  var cartItems = req.body.cartItems;

  try {
    const updatedCartItems = cartItems;

    // Update cart in the database with the new items array
    cartModel
      .updateOne({ userId: userId }, { $set: { items: updatedCartItems } })
      .then((result) => {
        console.log("Successfully updated items:", result);
      })
      .catch((error) => {
        console.log("Error updating items:", error);
      });
    res.json("Done");
  } catch (err) {
    // Handle any errors
    console.error(err);
  }
});

// Route to render the payment page
router.get("/cart/payment", requireAuth, async (req, res) => {
  res.render("payment");
});

// Route to handle payment processing
router.post("/cart/payment", async (req, res) => {
  // Extracting relevant information from the request body
  const { cardNumber, cardHolder, expirationDate, cvv, paymentMethod, user } = req.body;

  // Initializing variables
  var total = 0;
  const cartForCurrentUser = await cartModel.findOne({ userId: user._id });
  var items = cartForCurrentUser.items;
  var itemsWithMoreQuantity = [];
  var orderDetails = "";

  // Loop through items in the user's cart
  for (let index = 0; index < items.length; index++) {
    const element = items[index];

    // Retrieve product details from the database
    const product = await productModel.findOne({ _id: element.productId });
    var num = index + 1;

    // Build order details string for email notification
    orderDetails += num + ") Product name: " + product.name + ", Quantity: " + element.quantity + "\n";
    console.log(product.quantity);

    // Check product availability
    if (product.quantity > 0) {
      itemsWithMoreQuantity.push(element);
      total += product.price * element.quantity;

      // Update product quantity and purchase quantity in the database
      var newQuantity = product.quantity - element.quantity;
      var newPurchaseQuantity = product.purchaseQuantity + element.quantity;

      // Update product information
      await productModel
        .findOneAndUpdate({ _id: element.productId }, { $set: { quantity: newQuantity, purchaseQuantity: newPurchaseQuantity } }, { new: true })
        .then((updatedProduct) => {
          if (updatedProduct) {
            console.log("Product updated successfully:", updatedProduct);
          } else {
            console.log("Product not found");
          }
        })
        .catch((error) => {
          console.error("Error updating product:", error);
        });

      const productAfter = await productModel.findOne({ _id: element.productId });

      // If product qunty less than 10 the main admin will get an email
      if (productAfter.quantity < 10) {
        const mainadmin = await UserModel.findOne({ role: "mainadmin" });

        var text = `Product quantity is running low \nProduct: ${productAfter.name} \n`;
        var transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "spiritualdrinks.shop@gmail.com",
            pass: "vnwd jpxa ztkj cpkh",
          },
        });

        // Sending the email
        var mailOptions = {
          from: "spiritualdrinks.shop@gmail.com",
          to: mainadmin.email,
          subject: "Product Quantity",
          text: text,
        };

        transporter.sendMail(mailOptions, async function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      }
    }
  }

  // Compose email notification for the main admin about the new order
  const mainadmin = await UserModel.findOne({ role: "mainadmin" });
  var text = `Customer's name: ${user.firstname} ${user.lastname} \nOrder Details: \n${orderDetails} `;
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "spiritualdrinks.shop@gmail.com",
      pass: "vnwd jpxa ztkj cpkh",
    },
  });

  // Sending the email
  var mailOptions1 = {
    from: "spiritualdrinks.shop@gmail.com",
    to: mainadmin.email,
    subject: "New Order",
    text: text,
  };

  // Validate credit card information
  if (paymentMethod == "creditCard") {
    if (!validatecardNumber(cardNumber)) {
      res.status(400).json({ status: "cardNumber not valid" });
    } else if (!validatecardHolder(cardHolder)) {
      res.status(400).json({ status: "cardHolder not valid" });
    } else if (!validateexpirationDate(expirationDate)) {
      res.status(400).json({ status: "expirationDate not valid" });
    } else if (!validatecvv(cvv)) {
      res.status(400).json({ status: "cvv not valid" });
    } else {
      // Send email notification to the main admin about the new order
      transporter.sendMail(mailOptions1, async function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      // Create a new order document for credit card payment
      const newOrder = new orderModel({
        userId: cartForCurrentUser.userId,
        items: itemsWithMoreQuantity,
        total_amount: total,
        payment: {
          card_number: cardNumber,
          expiration_date: expirationDate,
          payment_method: "Visa",
        },
        status: "pending",
      });

      // Save the new order to the database
      newOrder
        .save()
        .then((savedOrder) => {
          console.log("Order saved successfully:", savedOrder);
        })
        .catch((error) => {
          console.error("Error saving order:", error);
        });

      // Clear the user's cart after successful order creation
      cartModel
        .updateOne({ userId: cartForCurrentUser.userId }, { $set: { items: [] } })
        .then((result) => {
          if (result.nModified > 0) {
            console.log("Cart cleared successfully");
          } else {
            console.log("User not found or cart was already empty");
          }
        })
        .catch((error) => {
          console.error("Error clearing cart:", error);
        });

      // Respond with a success status
      res.status(201).json("done");
    }
  } else {
    // If payment method is not credit card, proceed with cash payment
    // Send email notification to the main admin about the new order
    transporter.sendMail(mailOptions1, async function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    // Create a new order document for cash payment
    const newOrder = new orderModel({
      userId: cartForCurrentUser.userId,
      items: itemsWithMoreQuantity,

      total_amount: total,
      payment: {
        card_number: "",
        expiration_date: "",
        payment_method: "Cash",
      },
      status: "pending",
    });

    // Save the new order to the database
    newOrder
      .save()
      .then((savedOrder) => {
        console.log("Order saved successfully:", savedOrder);
      })
      .catch((error) => {
        console.error("Error saving order:", error);
      });

    // Clear the user's cart after successful order creation
    cartModel
      .updateOne({ userId: cartForCurrentUser.userId }, { $set: { items: [] } })
      .then((result) => {
        if (result.nModified > 0) {
          console.log("Cart cleared successfully");
        } else {
          console.log("User not found or cart was already empty");
        }
      })
      .catch((error) => {
        console.error("Error clearing cart:", error);
      });

    // Respond with a success status
    res.status(201).json("done");
  }
});

function validatecardNumber(cardNumber) {
  const cardNumberRegex = /^[0-9]{16}$/;
  if (!cardNumberRegex.test(cardNumber)) {
    return false; // Invalid card number format
  }
  return true;
}

// Validate Cardholder Name (Assuming alphabetical characters only for simplicity)
function validatecardHolder(cardHolder) {
  const cardHolderRegex = /^[A-Za-z\s]+$/; // Regular expression for cardholder name
  if (!cardHolderRegex.test(cardHolder)) {
    return false; // Invalid cardholder name format
  }
  return true;
}

// Validate CVV (Assuming a 3-digit CVV)
function validatecvv(cvv) {
  const cvvRegex = /^[0-9]{3}$/; // Regular expression for CVV (3 digits)
  if (!cvvRegex.test(cvv)) {
    return false; // Invalid CVV format
  }
  return true;
}

// Validate Expiration Date (Assuming MM/YY format)
function validateexpirationDate(expirationDate) {
  const expirationDateRegex = /^(0[1-9]|1[0-2])\/[0-9]{2}$/; // Regular expression for MM/YY format
  if (!expirationDateRegex.test(expirationDate)) {
    return false; // Invalid expiration date format
  }
  return true;
}

module.exports = router;
