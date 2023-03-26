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
module.exports = router;
