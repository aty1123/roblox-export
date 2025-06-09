const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const OUTPUT_FILE = "merged_data.json";

app.post("/upload", (req, res) => {
  const newData = req.body;
  let existing = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT_FILE));
  }
  for (const userId in newData) {
    existing[userId] = newData[userId];
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2));
  res.send("✅ 업로드 성공");
});

app.get("/download", (req, res) => {
  if (fs.existsSync(OUTPUT_FILE)) {
    res.sendFile(__dirname + "/" + OUTPUT_FILE);
  } else {
    res.status(404).send("❌ 파일 없음");
  }
});

app.get("/", (req, res) => {
  res.send("🚀 서버 실행 중입니다.");
});

app.listen(PORT, () => {
  console.log(`✅ 서버 시작됨: 포트 ${PORT}`);
});
