const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Golabob API가 정상적으로 동작 중입니다.",
  });
});

module.exports = router;
