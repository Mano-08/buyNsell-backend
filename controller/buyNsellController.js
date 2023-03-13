const Login = require("../models/loginSchema");

const login = (req, res, next) => {
  const { username, password, isAdmin } = req.body;

  Login.findOne({ username: username }, async (err, data) => {
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

const register = (req, res, next) => {
  const { name, mail, password, year, course, phone, address } = req.body;
  console.log("hi");
  res.status(200).json({
    received: "true",
  });
};

module.exports = {
  login,
  register,
};
