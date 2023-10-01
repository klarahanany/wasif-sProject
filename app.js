const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes')
const orderNowRoutes = require('./routes/orderNowRoutes')

const cookieParser = require ('cookie-parser')
const bodyParser = require('body-parser');
const {currentUser,requireAuth} = require("./middleware/authMiddware");
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
//   var personSchema = mongoose.Schema({
//     name: String,
//     age: Number,
//     nationality: String
//  });
//  var Person = mongoose.model("Person", personSchema);

// routes
app.get('*', currentUser)//apply to every route (protect routes)
app.get('/', (req, res) => res.render('home'));
const drinks = [
  {
      id: 1,
      name: 'Spiritual Tea',
      description: 'A calming and soothing tea for mindfulness.',
      price: 5.99
  },
  {
      id: 2,
      name: 'Meditation Coffee',
      description: 'Awaken your senses with our meditation coffee blend.',
      price: 4.99
  },
  {
      id: 3,
      name: 'Zen Juice',
      description: 'A refreshing juice that brings inner peace.',
      price: 3.49
  }
];
app.get('/smoothies', requireAuth,(req, res) => res.render('smoothies'));
app.get('/order', requireAuth,(req, res) => res.render('orderNow',{ drinks }));
app.use('/order',orderNowRoutes)
app.use("/",authRoutes)

