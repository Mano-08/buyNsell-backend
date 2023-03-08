const mongoose = require("mongoose");
const schema = mongoose.schema;

const UsersSchema = new schema({
  userid: Number,
  name: String,
  password: String,
  branch: String,
  phone: Number,
  year: Number,
  email: String,
  address: String,
});

const User = mongoos.model("User", UsersSchema, "UsersTable");

module.exports = user;
