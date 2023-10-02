const express = require('express');
const mongoose = require('mongoose');
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
app.post('/upload', upload.single("image"),(req,res)=>{
  console.log(req.body.image)
  res.send("uploaded")
})

// routes
app.get('*', currentUser)//apply to every route (protect routes)
app.get('*', currentAdminUser)//apply to every route (protect routes)
app.get('/', (req, res) => res.render('home'));

app.get('/smoothies', requireAuth, (req, res) => res.render('smoothies'));
app.use('/profile', profileRoutes)
app.use('/reviews', reviewRoutes)
app.use('/order', orderNowRoutes)
app.use('/admin', adminRoutes)

app.use("/", authRoutes)

