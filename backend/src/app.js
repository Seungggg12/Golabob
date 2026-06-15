const cors = require("cors");
const express = require("express");

const healthRouter = require("./routes/health");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter);

app.use((req, res) => {
  res.status(404).json({
    message: "요청한 API를 찾을 수 없습니다.",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || "서버 내부 오류가 발생했습니다.",
  });
});

module.exports = app;
