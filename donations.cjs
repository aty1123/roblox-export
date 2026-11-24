"use strict";

const { createHash, timingSafeEqual } = require("node:crypto");
const MAIN_UNIVERSE = 7846287280;
const TEST_UNIVERSE = 9453473631;
const donationUniverses = new Set([MAIN_UNIVERSE, TEST_UNIVERSE]);
const positive = n => Number.isSafeInteger(n) && n > 0;
const digest = value => createHash("sha256").update(value).digest();

function authenticated(req, key) {
    return typeof key === "string" && key.length > 0 &&
        timingSafeEqual(digest(req.get("authorization") || ""), digest("Bearer " + key));
}

function valid(r) {
    return r && donationUniverses.has(r.universeId) && positive(r.userId) && positive(r.productId) &&
        (r.purchasePlaceId == null || positive(r.purchasePlaceId)) &&
        (r.processedPlaceId == null || positive(r.processedPlaceId)) &&
        Number.isSafeInteger(r.amount) && r.amount >= 0 &&
        typeof r.purchaseId === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(r.purchaseId);
}

// One small shard is transacted per payment. Retrying also repairs projections after a partial write.
async function record(root, receipt, now = Date.now()) {
    const { userId, purchaseId, productId, amount } = receipt;
    const hash = digest(purchaseId).toString("hex");
    const shard = "b" + hash.slice(0, 2);
    const user = root.child("ledger").child(String(userId));
    const batch = await user.child(shard).transaction(previous => {
        const value = previous || { amount: 0, count: 0, receipts: {} };
        const old = value.receipts[hash];
        if (old) return value;
        if (!Number.isSafeInteger(value.amount + amount)) return;
        const event = { id: purchaseId, productId, amount, at: now, universeId: receipt.universeId };
        if (receipt.purchasePlaceId != null) event.purchasePlaceId = receipt.purchasePlaceId;
        if (receipt.processedPlaceId != null) event.processedPlaceId = receipt.processedPlaceId;
        value.receipts[hash] = event;
        value.amount += amount;
        value.count++;
        return value;
    }, undefined, false);
    if (!batch.committed) throw new Error("receipt pending");
    const saved = batch.snapshot.val();
    const event = saved.receipts[hash];
    if (event.id !== purchaseId || event.amount !== amount || event.productId !== productId ||
        (event.universeId ?? MAIN_UNIVERSE) !== receipt.universeId)
        throw new Error("receipt conflict");
    const summary = await root.child("users").child(String(userId)).transaction(previous => {
        const value = previous || { total: 0, count: 0, shards: {} };
        const part = value.shards[shard] || { amount: 0, count: 0 };
        if (saved.count > part.count) {
            value.total += saved.amount - part.amount;
            value.count += saved.count - part.count;
            if (!Number.isSafeInteger(value.total)) return;
            value.shards[shard] = { amount: saved.amount, count: saved.count };
        }
        if (!value.last || event.at > value.last.at || (event.at === value.last.at && event.id > value.last.id))
            value.last = event;
        const recent = Object.values(value.recent || {}).filter(row => row.id !== event.id);
        recent.push(event);
        recent.sort((a,b) => b.at - a.at || b.id.localeCompare(a.id));
        value.recent = recent.slice(0,10);
        return value;
    }, undefined, false);
    if (!summary.committed) throw new Error("summary pending");
    const total = summary.snapshot.child("total").val();
    const rank = await root.child("rank").child(String(userId)).transaction(old => Math.max(old || 0, total), undefined, false);
    if (!rank.committed) throw new Error("ranking pending");
    return total;
}

function installDonations(app, db) {
    const root = db.ref("supportReceiptsV1");
    let checkedUntil = 0, checking;
    function writer(req, res, next) {
        if (!process.env.DONATION_WRITE_KEY) return res.sendStatus(503);
        if (!authenticated(req, process.env.DONATION_WRITE_KEY)) return res.sendStatus(401);
        next();
    }
    app.get("/donations/ready", writer, async (req, res) => {
        const universeId = req.query.universeId === undefined ? MAIN_UNIVERSE : Number(req.query.universeId);
        if (!donationUniverses.has(universeId)) return res.sendStatus(400);
        try {
            if (Date.now() >= checkedUntil) {
                checking ||= root.child("health").once("value").finally(() => { checking = undefined; });
                await checking;
                checkedUntil = Date.now() + 60000;
            }
            res.json({ universeId, ready: true });
        } catch { res.sendStatus(503); }
    });
    app.post("/donations/receipt", writer, async (req, res) => {
        if (!valid(req.body)) return res.sendStatus(400);
        try {
            const total = await record(root, req.body);
            res.json({ stored: true, purchaseId: req.body.purchaseId, total });
        } catch (error) {
            if (error.message === "receipt conflict") return res.sendStatus(409);
            console.error("Donation storage unavailable", error.code || error.name);
            res.sendStatus(503);
        }
    });
    app.get("/admin/donations/:id", async (req, res) => {
        res.set("Cache-Control", "no-store");
        if (!authenticated(req, process.env.API_SECRET_KEY)) return res.sendStatus(401);
        if (!/^[1-9]\d{0,15}$/.test(req.params.id) || !positive(Number(req.params.id))) return res.sendStatus(400);
        try {
            const snap = await root.child("users").child(req.params.id).once("value");
            const { total = 0, count = 0, last = null, recent = [] } = snap.val() || {};
            res.json({ total, count, last, recent });
        } catch { res.sendStatus(503); }
    });
    return (publish, fail) => {
        const q = root.child("rank").orderByValue().startAt(1).limitToLast(50);
        function changed(snap) {
            const rows = [];
            snap.forEach(item => { rows.push({ id: item.key, value: item.val() }); });
            publish(rows);
        }
        q.on("value", changed, fail);
        return () => q.off("value", changed);
    };
}
module.exports = { installDonations, record, valid };
