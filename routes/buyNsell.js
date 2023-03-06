const express = require("express");
const router = express.Router();
const buyNsell = require("../controller/buyNsellController");

router.post("/login", buyNsell.login);

module.exports = router;
