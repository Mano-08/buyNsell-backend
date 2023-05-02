const express = require("express");
const router = express.Router();
const buyNsell = require("../controller/buyNsellController");
const crypto = require("crypto");

router.post("/login", buyNsell.login);
router.post("/register", buyNsell.register);
router.post("/", buyNsell.token);
router.delete("/", buyNsell.delToken);
router.post("/profile", buyNsell.profile);
router.post("/deleteAccount", buyNsell.delAcc);
router.get("/users/:id/verify/:token", buyNsell.verify);
router.post("/logout", buyNsell.logout);
router.post("/allprod", buyNsell.displayProd);
router.post("/sell", buyNsell.sell);
router.post("/update", buyNsell.update);
router.post("/prodData", buyNsell.prodData);
router.post("/addbid", buyNsell.addbid);
router.post("/fixdeal", buyNsell.fixdeal);
router.post("/removebid", buyNsell.removebid);
router.post("/confirmdeal", buyNsell.confirmdeal);
router.post("/cancelnotification", buyNsell.cancelnotification);

module.exports = router;
