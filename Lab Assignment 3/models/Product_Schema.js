const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String, 
    required: true,
  },
});

module.exports = mongoose.model("Product", ProductSchema);