const User = require("../models/userSchema");

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

module.exports = {
  login,
};
