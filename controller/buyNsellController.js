const User = require("../models/user");
const Token = require("../models/token");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcrypt");
const Product = require("../models/products");
const Bid = require("../models/bid");
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
    const url = `Click this link to verify your email-id : ${process.env.BASE_URL}users/${user.id}/verify/${token.token}`;
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
    .then(async ({ tokenDetails }) => {
      const payload = { _id: tokenDetails._id, role: tokenDetails.role };
      const accessToken = jwt.sign(payload, process.env.JWTPRIVATEKEY, {
        expiresIn: "14m",
      });
      const allNotifications = await Bid.find({
        sellerId: tokenDetails._id,
      });
      var findata = [];
      for (let i = 0; i < allNotifications.length; i++) {
        const { pimage, pname } = await Product.findById(
          allNotifications[i].prodId
        );
        for (let j = 0; j < allNotifications[i].bids.length; j++) {
          const { name } = await User.findById(
            allNotifications[i].bids[j].buyerId
          );
          if (allNotifications[i].bids[j].cancel === false) {
            findata.push({
              prodId: allNotifications[i].prodId,
              href: `/buy-product/${allNotifications[i].prodId}/${tokenDetails._id}/${allNotifications[i].bids[j].buyerId}`,
              imageURL: pimage,
              reg: name,
              pname: pname,
              bprice: allNotifications[i].bids[j].bidPrice,
              cancel: allNotifications[i].bids[j].cancel,
              bid: allNotifications[i].bids[j].buyerId,
            });
          }
        }
      }
      res.status(200).send({
        error: false,
        userid: tokenDetails._id,
        allNotifications: findata,
        role: tokenDetails.role,
        message: "Access token created successfully",
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send(err);
    });
};

const delToken = async (req, res) => {
  try {
    const usertoken = await UserToken.findOne({ token: req.body.refreshToken });
    if (!usertoken)
      return res
        .status(200)
        .send({ error: false, message: "Logged Out Sucessfully" });

    await usertoken.remove();
    res.status(200).send({ error: false, message: "Logged Out Sucessfully" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: true, message: "Internal Server Error" });
  }
};

const fixdeal = async (req, res) => {
  try {
    const { productid, sellerid, buyerid } = req.body;
    const { pname, pprice, pimage } = await Product.findById(productid);
    var findata = { pname: pname, productprice: pprice, pimage: pimage };
    const biddata = await Bid.findOne({ prodId: productid });
    for (let i = 0; i < biddata.bids.length; i++) {
      if (biddata.bids[i].buyerId.toString() === buyerid) {
        findata = { ...findata, bidprice: biddata.bids[i].bidPrice };
        break;
      }
    }
    const { name, mail } = await User.findById(buyerid);
    findata = { ...findata, buyername: name };
    findata = { ...findata, mail: mail };
    res.status(200).send({ fixdeal: findata });
  } catch (error) {
    console.log(error);
    res.status(300).send({ error: true });
  }
};

const profile = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findOne({ _id: id });

    var arr = [];
    const data = await Bid.find({});

    for (let i = 0; i < data.length; i++) {
      var { pname, pimage, pprice } = await Product.findById(data[i].prodId);
      for (let j = 0; j < data[i].bids.length; j++) {
        if (data[i].bids[j].buyerId.toString() === id) {
          const temp = {
            pname: pname,
            pimage: pimage,
            bidPrice: data[i].bids[j].bidPrice,
            bidtime: data[i].bids[j].bidTime,
            bid: id,
            pid: data[i].prodId,
            pprice: pprice,
          };
          arr.push(temp);
        }
      }
    }
    const mydata = await Product.find({ id: id });

    var myprodData = [];
    for (let i = 0; i < mydata.length; i++) {
      const temp = {
        id: mydata[i]._id,
        pname: mydata[i].pname,
        pprice: mydata[i].pprice,
        pimage: mydata[i].pimage,
        preg: mydata[i].preg,
      };
      myprodData.push(temp);
    }
    if (!user) {
      res.status(400).send({
        error: true,
        message: "User not found",
        data: user,
        mybids: arr,
        myproducts: myprodData,
      });
    }
    res
      .status(200)
      .send({ erro: false, data: user, mybids: arr, myproducts: myprodData });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: true });
  }
};

const deletemyprod = async (req, res) => {
  try {
    const { pid } = req.body;
    await Product.deleteOne({ _id: pid });
    await Bid.deleteOne({ prodId: pid });
    res.status(200).send({ error: false });
  } catch (error) {
    res.status(400).send({ error: true });
  }
};

const delAcc = async (req, res) => {
  try {
    const id = req.body.id;
    await User.deleteOne({ _id: id });
    await UserToken.deleteOne({ userId: id });
    res
      .status(200)
      .send({ error: false, message: "Account deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: true });
  }
};

const logout = async (req, res) => {
  try {
    const id = req.body.id;
    await UserToken.deleteOne({ userId: id });
    res.status(200).send({ error: false, message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: true });
  }
};

const update = async (req, res) => {
  try {
    const newData = req.body.newData;
    const id = req.body.id;
    await User.updateOne({ _id: id }, newData);
    res.status(200).send({ error: false, message: "Updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: true });
  }
};

const displayProd = async (req, res) => {
  try {
    const data = await Product.find({}).lean();
    res.status(200).send({ error: false, details: data });
  } catch (error) {
    console.log("Error: ", error);
    res.status(400).send({ error: true });
  }
};

const prodData = async (req, res) => {
  try {
    const id = req.body.id;
    console.log(id);
    const data = await Product.findById(id);
    const bid = await Bid.findOne({ prodId: id });
    const { name, mail } = await User.findById(data.id);
    res.status(200).send({ error: false, details: { data, bid, name, mail } });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: true });
  }
};

const sell = async (req, res) => {
  try {
    const { pdata, id } = req.body;
    pdata[id] = id;
    await Product.create(pdata);
    res
      .status(200)
      .send({ error: false, message: "Product added successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: true, message: "Product wasn't added" });
  }
};

const addbid = async (req, res) => {
  try {
    const { biddata } = req.body;
    const bidDataFromDB = await Bid.findOne({
      prodId: biddata.pid,
    });
    const { mail } = await User.findById(biddata.buyerId);
    const reg = mail.slice(0, 6);
    if (!bidDataFromDB) {
      const newData = {
        prodId: biddata.pid,
        sellerId: biddata.sellerId,
        bids: [
          {
            buyerId: biddata.buyerId,
            bidPrice: biddata.bidPrice,
            bidTime: biddata.bidTime,
            regno: reg,
            cancel: false,
          },
        ],
      };
      await Bid.create(newData);
    } else {
      bidDataFromDB.bids.push({
        buyerId: biddata.buyerId,
        bidPrice: biddata.bidPrice,
        bidTime: biddata.bidTime,
        regno: reg,
        cancel: false,
      });
      await Bid.updateOne(
        { prodId: biddata.pid, sellerId: biddata.sellerId },
        bidDataFromDB
      );
    }
    const dataFromdb = await Bid.findOne({
      prodId: biddata.pid,
      sellerId: biddata.sellerId,
    });
    res.status(200).send({ details: { bid: dataFromdb } });
  } catch (err) {
    console.log(err);
  }
};

const removebid = async (req, res) => {
  try {
    const { productid, buyerId } = req.body;
    var bid = await Bid.findOne({ prodId: productid });
    console.log(bid, buyerId);
    var arr = [];
    for (let i = 0; i < bid.bids.length; i++) {
      if (bid.bids[i].buyerId.toString() !== buyerId) {
        console.log(
          bid.bids[i].buyerId,
          buyerId,
          bid.bids[i].buyerId !== buyerId
        );
        arr.push(bid.bids[i]);
      }
    }
    console.log(arr);
    bid.bids = arr;
    await Bid.updateOne({ prodId: productid }, bid);
    res.status(200).send({ error: false, details: { bid: bid } });
  } catch (error) {
    console.log(error);
    res.status(302).send({ error: true });
  }
};

const confirmdeal = async (req, res) => {
  try {
    const { productid, sellerid, mail, productname, bprice } = req.body;
    const sellerinfo = await User.findById(sellerid);
    await Product.deleteOne({ _id: productid });
    await Bid.deleteOne({ prodId: productid });
    console.log(sellerinfo);
    const text = `Hi, I am ${sellerinfo.name}, and I look forward to fixing the deal of ${productname} for Rs.${bprice}.\nYou can find my contact details attached here\nAddress: ${sellerinfo.address}\nPhone  : ${sellerinfo.phone}\nEmail  : ${sellerinfo.mail}`;
    await sendEmail(mail, "Confirm Deal", text);
    res.status(200).send({ error: false });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: true });
  }
};

const cancelnotification = async (req, res) => {
  try {
    const { prodid, bid } = req.body;
    var notifitcation = await Bid.findOne({ prodId: prodid });
    for (let i = 0; i < notifitcation.bids.length; i++) {
      if (notifitcation.bids[i].buyerId.toString() === bid) {
        notifitcation.bids[i].cancel = true;
      }
    }
    await Bid.updateOne({ prodId: prodid }, notifitcation);

    var findata = [];
    const sellerid = notifitcation.sellerId;
    notifitcation = await Bid.find({ sellerId: sellerid });
    console.log(notifitcation);
    for (let i = 0; i < notifitcation.length; i++) {
      const { id, pimage, pname } = await Product.findById(
        notifitcation[i].prodId
      );
      for (let j = 0; j < notifitcation[i].bids.length; j++) {
        const { name } = await User.findById(notifitcation[i].bids[j].buyerId);
        if (notifitcation[i].bids[j].cancel === false) {
          findata.push({
            prodId: notifitcation[i].prodId,
            href: `/buy-product/${notifitcation[i].prodId}/${id}/${notifitcation[i].bids[j].buyerId}`,
            imageURL: pimage,
            reg: name,
            pname: pname,
            bprice: notifitcation[i].bids[j].bidPrice,
            cancel: notifitcation[i].bids[j].cancel,
            bid: notifitcation[i].bids[j].buyerId,
          });
        }
      }
    }
    console.log(findata);
    res.status(200).send({ allNotifications: findata });
  } catch (error) {
    res.status(400).send({ error: true });
  }
};

const deletemybid = async (req, res) => {
  try {
    const { pid, bid } = req.body;
    console.log(pid, bid);
    var biddata = await Bid.findOne({ prodId: pid });
    var arr = [];
    for (let i = 0; i < biddata.bids.length; i++) {
      if (biddata.bids[i].buyerId.toString() !== bid) {
        arr.push(biddata.bids[i]);
      }
    }
    biddata.bids = arr;
    await Bid.updateOne({ prodId: pid }, biddata);
    console.log(biddata);
    res.status(200).send({ error: false });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: true });
  }
};

module.exports = {
  prodData,
  deletemybid,
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
  addbid,
  removebid,
  fixdeal,
  deletemyprod,
  confirmdeal,
  cancelnotification,
};
