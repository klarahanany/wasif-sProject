const mongoose = require("mongoose");

// Define the product schema using Mongoose
const productSchema = new mongoose.Schema({
  // URL to the product image, required
  image: {
    type: String,
    required: true,
  },
  // Name of the product, required, trimmed, and must be unique
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  // Description of the product, required
  description: {
    type: String,
    required: true,
  },
  // Price of the product, required and must be non-negative
  price: {
    type: Number,
    required: true,
    min: 0, // Ensure price is non-negative
  },
  // Quantity of the product, required and must be non-negative
  quantity: {
    type: Number,
    required: true,
    min: 0, // Ensure quantity is non-negative
  },
  // Category of the product, required, and must be one of the specified values
  category: {
    type: String,
    required: true,
    enum: ["Wine", "Alcohol", "Beer", "Accessories"],
  },
  // Date when the product was created, defaults to the current date and time
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Purchase quantity of the product, required, and must be non-negative, default is 0
  purchaseQuantity: {
    type: Number,
    required: true,
    min: 0, // Ensure purchaseQuantity is non-negative
    default: 0,
  },
});

// Create a Mongoose model named "Product" based on the productSchemas
const productModel = mongoose.model("Product", productSchema);

// Data to be inserted into the database
const dataToInsert = [
  {
    image: "1697619160426.avif",
    name: "Corona Extra Lager Mexican Beer",
    description: "Corona Extra is a refreshing Mexican lager beer with a smooth taste.",
    price: 1.99,
    quantity: 6,
    category: "Beer",
  },
  {
    image: "1697619336636.avif",
    name: "Bud Light",
    description: "Bud Light is a popular American light lager known for its refreshing taste and easy drinkability.",
    price: 1.99,
    quantity: 16,
    category: "Beer",
  },
  {
    image: "1697619533325.avif",
    name: "Stella Artois",
    description: "Stella Artois is a high-quality Belgian lager beer with a flavorful taste. It is meant to be enjoyed with friends.",
    price: 1.99,
    quantity: 7,
    category: "Beer",
  },
  {
    image: "1697619616902.avif",
    name: "Heineken",
    description: "Heineken A refreshing, global lager beer with a subtle malt flavor and a clean finish.",
    price: 2.49,
    quantity: 14,
    category: "Beer",
  },
  {
    image: "1697619732259.avif",
    name: "Budweiser",
    description: "Budweiser is a medium-bodied, American-style lager beer with a crisp, flavorful taste.",
    price: 2.99,
    quantity: 11,
    category: "Beer",
  },
  {
    image: "1697620272337.avif",
    name: "Josh Cellars Cabernet Sauvignon",
    description: "Your Cabernet Sauvignon sounds delicious and well-made. You put a lot of care into crafting it.",
    price: 14.99,
    quantity: 20,
    category: "Wine",
  },
  {
    image: "1697620413215.avif",
    name: "Oyster Bay Sauvignon Blanc White Wine",
    description: "Refreshing New Zealand white wine with tropical fruit and citrus aromas and a zesty finish.",
    price: 19.99,
    quantity: 20,
    category: "Wine",
  },
  {
    image: "1697620607966.avif",
    name: "Veuve Clicquot Brut Yellow Label Champagne",
    description:
      "Veuve Clicquot Yellow Label is the signature champagne of the House. Dominated by Pinot Noir, it offers a perfect balance of structure and finesse.",
    price: 49.99,
    quantity: 30,
    category: "Wine",
  },
  {
    image: "1697621070973.avif",
    name: "Jack Daniel's Old No. 7 Tennessee Whiskey",
    description: "Jack Daniel's Tennessee Whiskey is made from the finest grains and water, charcoal mellowed, and matured in handcrafted barrels.",
    price: 26.99,
    quantity: 30,
    category: "Alcohol",
  },
  {
    image: "1697621157836.avif",
    name: "The Macallan Double Cask 12 Year Old Single Malt Scotch Whisky",
    description:
      "The Macallan Double Cask 12 Year Old Scotch is a rich and perfectly balanced Scotch whisky with flavors of fruit, caramel, oak spice, citrus, and vanilla.",
    price: 89.99,
    quantity: 45,
    category: "Alcohol",
  },
  {
    image: "1697621308712.avif",
    name: "Johnnie Walker Black Label Blended Scotch Whisky",
    description:
      "Johnnie Walker Black Label is a blended Scotch whisky with flavors of rich dark fruits, sweet vanilla, creamy toffee, and a smooth warming smoke finish. It is matured in oak casks for a minimum of 12 years.",
    price: 39.99,
    quantity: 9,
    category: "Alcohol",
  },
  {
    image: "1697621403014.avif",
    name: "Glenfiddich 12 Year Old Single Malt Scotch Whisky",
    description:
      "The Glenlivet 12 Year Old is a smooth and fruity single malt Scotch whisky with notes of vanilla, peaches, pears, pineapple, marzipan, and hazelnuts. It has a long, creamy, and smooth finish.",
    price: 49.99,
    quantity: 99,
    category: "Alcohol",
  },
  {
    image: "1697621754704.avif",
    name: "GREY GOOSE Vodka",
    description:
      "Grey Goose Vodka is a premium vodka made in France with the finest wheat and spring water. It has a smooth and elegant taste with subtle hints of almond.",
    price: 34.99,
    quantity: 101,
    category: "Alcohol",
  },
  {
    image: "1697622847218.avif",
    name: "Absolut Original Vodka",
    description:
      "Absolut Vodka is a premium vodka from Sweden made with winter wheat. It has a rich and full-bodied flavor and is perfect for mixing in cocktails. Absolut is known for its iconic bottle design and its commitment to art and culture.",
    price: 24.99,
    quantity: 9,
    category: "Alcohol",
  },
  {
    image: "1697623599070.avif",
    name: "Wine Gift Bags",
    description: "Wine Gift Bags",
    price: 3.99,
    quantity: 99,
    category: "Accessories",
  },
  {
    image: "1697623651370.avif",
    name: "10x Plastic Champagne Flutes",
    description: "Plastic Champagne Flutes",
    price: 9.99,
    quantity: 99,
    category: "Accessories",
  },
  {
    image: "1697623748888.avif",
    name: "10x Red Plastic Beer Cups",
    description: "Red Plastic Beer Cups",
    price: 4.49,
    quantity: 99,
    category: "Accessories",
  },
  {
    image: "1697623847901.avif",
    name: "20x Plastic Shot Glass",
    description: "Plastic Shot Glass",
    price: 5.99,
    quantity: 98,
    category: "Accessories",
  },
];

// Insert multiple documents using the create method with an array
productModel
  .create(dataToInsert)
  .then((savedDataArray) => {
    console.log("Data saved successfully:", savedDataArray);
  })
  .catch((err) => {
    console.error(err);
  });

// Export the productModel to be used in other parts of the application
module.exports = productModel;
