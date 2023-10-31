const express = require('express');
const mongoose = require('mongoose');
const Review = require('./models/Review'); // Assuming you have a Review model
const UserModel = require('./models/userModel.js');
const productModel = require('./models/productModel.js')
const multer = require('multer');
const authRoutes = require('./routes/authRoutes')
const orderNowRoutes = require('./routes/orderNowRoutes')
const profileRoutes = require('./routes/profileRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const adminRoutes = require('./routes/adminRoutes')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const { currentUser, requireAuth, currentAdminUser } = require("./middleware/authMiddware");
const app = express();
// middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json())
app.use(cookieParser())
app.set('view engine', 'ejs');
// database connection
const dbURI = 'mongodb://127.0.0.1:27017/SpiritualDrinksShop';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => app.listen(3000))
  .catch((err) => console.log(err));
// Set up Multer
const path = require('path')
// Set up Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images'); // Specify the directory where files should be saved
  },
  filename: function (req, file, cb) {
    // Use the original name of the file
    console.log(file)
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });
app.post('/upload', upload.single("image"), (req, res) => {
  console.log(req.body.image)
  res.send("uploaded")
})

// routes
app.get('*', currentUser)//apply to every route (protect routes)
app.get('*', currentAdminUser)//apply to every route (protect routes)
app.get('/', async (req, res) => {
  const reviews = await Review.find().limit(3); // Fetch reviews from your database
  const products = await productModel.find();
  var wineProducts = [];
  var alcoholProducts = [];
  var beerProducts = [];
  var accessoriesProducts = [];

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
  var bestSellerItems = []
  if (accessoriesMostSold) {
    bestSellerItems.push(accessoriesMostSold)
  }
  if (wineMostSold) {
    bestSellerItems.push(wineMostSold)
  } if (beerMostSold) {
    bestSellerItems.push(beerMostSold)
  } if (alcoholMostSold) {
    bestSellerItems.push(alcoholMostSold)
  }

  res.render('home', { reviews, bestSellerItems })
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
app.get('/smoothies', requireAuth, (req, res) => res.render('smoothies'));
app.use('/profile', profileRoutes)
app.use('/reviews', reviewRoutes)
app.use('/order', orderNowRoutes)
app.use('/admin', adminRoutes)

app.use("/", authRoutes)

