const express = require("express");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Railway 서버 작동 중!");
});

app.post("/backup", (req, res) => {
  const { userId, money, playtime } = req.body;
  console.log("📦 백업:", userId, money, playtime);
  res.send("✅ 백업 완료");
});

app.listen(process.env.PORT || 3000);
