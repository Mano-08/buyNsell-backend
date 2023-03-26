const User = require("../models/user");
const Token = require("../models/token");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcrypt");
const Product = require("../models/products");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const UserToken = require("../models/userToken");
const verifyRefreshToken = require("../utils/verifyRefreshToken");

const generateTokens = require("../utils/generateToken.js");
const login = async (req, res) => {
  try {
    const user = await User.findOne({ mail: req.body.mail });
    if (!user) {
      return res.status(401).send({ message: "Invalid Email or Password" });
    }
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(401).send({ message: "Invalid Email or Password" });
    }
    if (!user.verified) {
      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        token = await new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();
        const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
        await sendEmail(user.mail, "Verification of Email", url);
      }

      return res
        .status(400)
        .send({ message: "An Email sent to your account please verify" });
    }

    const { accessToken, refreshToken } = await generateTokens(user);
    const expiresAt = new Date(Date.now() + 14 * 60);
    res.status(200).send({
      message: "logged in successfully",
      refreshToken,
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const register = async (req, res) => {
  try {
    let user = await User.findOne({ mail: req.body.mail });
    if (user) {
      console.log("user exist");
      return res.status(200).send({
        message: "User with given email already Exist!",
        info: "userExist",
      });
    }
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    user = await new User({ ...req.body, password: hashPassword }).save();

    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();
    const url = `${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
    await sendEmail(user.mail, "Verification of Mail", url);

    res.status(201).send({
      message: "An Email sent to your account, please verify.",
      info: "mailSent",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const verify = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(400).send({ message: "Invalid link" });
    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });
    if (!token) return res.status(400).send({ message: "Invalid link" });

    await User.updateOne({ _id: user._id }, { verified: true });
    await Token.deleteOne({ userId: user._id });

    res.status(200).send({ message: "Email verified successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const token = async (req, res) => {
  verifyRefreshToken(req.body.token)
    .then(({ tokenDetails }) => {
      const payload = { _id: tokenDetails._id, role: tokenDetails.role };
      const accessToken = jwt.sign(payload, process.env.JWTPRIVATEKEY, {
        expiresIn: "14m",
      });
      res.status(200).json({
        error: false,
        userid: tokenDetails._id,
        role: tokenDetails.role,
        message: "Access token created successfully",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
};

const delToken = async (req, res) => {
  try {
    const usertoken = await UserToken.findOne({ token: req.body.refreshToken });
    if (!usertoken)
      return res
        .status(200)
        .json({ error: false, message: "Logged Out Sucessfully" });

    await usertoken.remove();
    res.status(200).json({ error: false, message: "Logged Out Sucessfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

const profile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.id });
    if (!user) {
      res.status(400).json({ error: true, message: "User not found" });
    }
    res.status(200).json({ erro: false, data: user });
  } catch (error) {
    console.log(err);
    res.status(400).json({ error: true });
  }
};

const delAcc = async (req, res) => {
  try {
    const id = req.body.id;
    await User.deleteOne({ _id: id });
    await UserToken.deleteOne({ userId: id });
    res
      .status(200)
      .json({ error: false, message: "Account deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: true });
  }
};

const logout = async (req, res) => {
  try {
    const id = req.body.id;
    await UserToken.deleteOne({ userId: id });
    res.status(200).json({ error: false, message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: true });
  }
};

const update = async (req, res) => {
  try {
    const newData = req.body.newData;
    const id = req.body.id;
    await User.updateOne({ _id: id }, newData);
    res.status(200).json({ error: false, message: "Updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: true });
  }
};

const displayProd = async (req, res) => {
  try {
    const data = await Product.find({});
    res.status(200).json({ error: false, details: data });
  } catch (error) {
    console.log("Error: ", error);
    res.status(400).json({ error: true });
  }
};

const sell = async (req, res) => {
  try {
    const { pdata, id } = req.body;
    pdata[id] = id;
    await Product.create(pdata);
    res
      .status(200)
      .json({ error: false, message: "Product added successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: true, message: "Product wasn't added" });
  }
};

module.exports = {
  login,
  logout,
  register,
  verify,
  token,
  delToken,
  profile,
  delAcc,
  update,
  displayProd,
  sell,
};
