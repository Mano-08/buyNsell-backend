const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Users = require("../models/usersSchema");

const login = (req, res, next) => {
  const { username, password, isAdmin } = req.body;

  User.findOne({ username: username }, async (err, data) => {
    if (err) {
      console.log(err);
    } else {
      if (data === null) {
        res.status(400).json({ message: "failed" });
      } else if (data !== null) {
        console.log(data);
        bcrypt.compare(password, data.password, (err, result) => {
          if (result) {
            res.status(200).json({
              message: "success",
              token: encode({
                username: data.username,
                isAdmin: data.isAdmin,
              }),
            });
          } else {
            res.status(400).json({ message: "failed" });
          }
        });
      }
    }
  })
    .clone()
    .catch(function (err) {
      console.log(err);
    });
};

const creatU = (req, res, next) => {
  const { userid, name, password, branch, phone, year, email, address } =
    req.body;
  const Users = new Users({
    userid: Number,
    name: String,
    password: String,
    branch: String,
    phone: Number,
    year: Number,
    email: String,
    address: String,
  });
  Users.save()
    .then(() => {
      res.status(200).json({ message: "User added success" });
    })
    .catch((error) => {
      res.status(400).json({ message: "User adding failed" });
    });
};

const removeU = async (req, res, next) => {
  let id = req.body.userid;
  await Users.findByIdAndDelete(id).catch(function (err) {
    console.log(err);
  });
};

module.exports = {
  login,
  createU,
  removeU,
};
