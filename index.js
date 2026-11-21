const express = require("express");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// 🔐 보안 키
const SECRET_KEY = process.env.API_SECRET_KEY;

// ✅ Firebase 인증 구성
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }),
  databaseURL: `https://roblox-backup-default-rtdb.asia-southeast1.firebasedatabase.app/`
});

const db = admin.database();
const { installPublicTop50, watchRealtimeDatabase } = require("./cheolsan-public-top50.cjs");
installPublicTop50(app, watchRealtimeDatabase(db.ref("users"), { Money: "money", Time: "playtime" }));

// ✅ 기본 상태 확인 라우트
app.get("/", (req, res) => {
  res.send("✅ Firebase 연동 서버 작동 중!");
});

// ✅ 백업 API
app.post("/backup", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${SECRET_KEY}`) {
    return res.status(401).send("❌ 인증 실패");
  }

  const { userId, money, playtime, username } = req.body;
  if (!userId) return res.status(400).send("userId 없음");

  try {
    await db.ref(`users/${userId}`).set({
      money,
      playtime,
      username: username || "Unknown",
      updatedAt: Date.now()
    });

    console.log("📦 Firebase에 저장됨:", userId, money, playtime);
    res.send("✅ 저장 성공!");
  } catch (err) {
    console.error("❌ 저장 실패:", err);
    res.status(500).send("❌ 저장 실패");
  }
});

// ✅ 관리자 UI HTML 제공
app.get("/admin", (req, res) => {
  const filePath = path.join(__dirname, "admin.html");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).send("파일을 불러올 수 없습니다.");
    res.set("Content-Type", "text/html");
    res.send(data);
  });
});

// ✅ 관리자 데이터 API
app.get("/admin/data", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${SECRET_KEY}`) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const snapshot = await db.ref("users").once("value");
    const data = snapshot.val();
    res.json(data || {});
  } catch (err) {
    console.error("❌ 관리자 데이터 로딩 실패:", err);
    res.status(500).send("서버 오류");
  }
});

// ✅ 서버 실행
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 서버 실행 중!");
  console.log("✅ Firebase 연동 서버 작동 중!");
});

app.post("/upload-json", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${SECRET_KEY}`) {
    return res.status(401).send("❌ 인증 실패");
  }

  try {
    const mergedData = req.body;

    for (const userId in mergedData) {
      const { money, playtime, username } = mergedData[userId];
      await db.ref(`users/${userId}`).set({
        money: money ?? 0,
        playtime: playtime ?? 0,
        username: username ?? "Unknown",
        updatedAt: Date.now()
      });
    }

    res.send("✅ 모든 데이터 업로드 성공!");
  } catch (err) {
    console.error("❌ 업로드 실패:", err);
    res.status(500).send("❌ 업로드 중 오류 발생");
  }
});
