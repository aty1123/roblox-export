const express = require("express");
const admin = require("firebase-admin");
const app = express();

app.use(express.json());

// 🔐 Firebase 인증 구성
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }),
  databaseURL: `https://roblox-backup-default-rtdb.asia-southeast1.firebasedatabase.app/`
});

const db = admin.database();
const SECRET_KEY = "aty1123-super-very-ultra-secret-key-20051123"; // 🔐 여기 추가

app.get("/", (req, res) => {
  res.send("✅ Firebase 연동 서버 작동 중!");
});

app.post("/backup", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${SECRET_KEY}`) {
    return res.status(401).send("❌ 인증 실패");
  }

  const { userId, money, playtime } = req.body;
  if (!userId) return res.status(400).send("userId 없음");

  try {
    await db.ref(`users/${userId}`).set({
      money,
      playtime,
      updatedAt: Date.now()
    });

    console.log("📦 Firebase에 저장됨:", userId, money, playtime);
    res.send("✅ 저장 성공!");
  } catch (err) {
    console.error("❌ 저장 실패:", err);
    res.status(500).send("❌ 저장 실패");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 서버 실행 중!");
  console.log("✅ Firebase 연동 서버 작동 중!");
});
