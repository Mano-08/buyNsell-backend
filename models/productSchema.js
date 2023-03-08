const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProdSchema = new Schema({
  prod_id: Number,
  prod_name: String,
  price: Number,
  description: String,
  location: String,
  prod_img: String,
  seller_id: Number,
  bought_date: Number,
  reg_date: Number,
});

const User = mongoose.model("User", ProdSchema, "ProdTable");

module.export = User;
