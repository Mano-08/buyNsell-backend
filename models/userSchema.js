const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: String,
  mail: String,
  year: Number,
  address: String,
  phone: Number,
  password: String,
  course: String,
});
