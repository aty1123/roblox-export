"use strict";

const { createHash } = require("node:crypto");

const PATH = "/public/rankings/top50";
const LIMIT = 50;
const WAIT_MS = 20000;

function rowsFor(entries) {
    return entries.flatMap(({ id, value }) => {
        const uid = Number(id);
        if (!/^[1-9]\d*$/.test(String(id)) || !Number.isSafeInteger(uid)) return [];
        if (!Number.isSafeInteger(value) || value < 0) return [];
        return [{ id: uid, value }];
    }).sort((a, b) => b.value - a.value || a.id - b.id).slice(0, LIMIT);
}

// watch(metric, onRows, onError) attaches ONE limited query and returns its unsubscribe function.
function installPublicTop50(app, watch) {
    let subscription, idleTimer, ready, retryAfter = 0, failures = 0;
    const waiting = new Set();
    function wake() {
        for (const done of [...waiting]) done();
    }
    function stop() {
        const previous = subscription;
        subscription = undefined;
        ready = undefined;
        if (previous) for (const off of previous.detach) off();
    }
    function activate() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(stop, 180000);
        idleTimer.unref?.();
        if (subscription || Date.now() < retryAfter) return;
        const group = { detach: [], data: {} };
        subscription = group;
        function unavailable() {
            if (subscription !== group) return;
            retryAfter = Date.now() + Math.min(60000, 2000 * 2 ** Math.min(failures++, 5));
            stop();
            wake();
        }
        try {
            for (const metric of ["Money", "Time", "Support"]) {
                const off = watch(metric, entries => {
                    if (subscription !== group) return;
                    group.data[metric] = rowsFor(entries);
                    const { Money, Time, Support } = group.data;
                    if (!Money || !Time || !Support) return;
                    const version = createHash("sha256").update(JSON.stringify([Money, Time, Support])).digest("hex");
                    if (ready?.version === version) return;
                    ready = { version, Money, Time, Support };
                    failures = 0;
                    wake();
                }, unavailable);
                if (subscription !== group) { off(); break; }
                group.detach.push(off);
            }
        } catch { unavailable(); }
    }
    app.get(PATH, (req, res) => {
        activate();
        res.set("Cache-Control", "no-store");
        if (!ready) return res.set("Retry-After", "5").sendStatus(503);
        const since = req.query.since;
        const tag = () => '"' + ready.version + '"';
        const sendCurrent = () => res.set("ETag", tag()).json(ready);
        if (since !== ready.version || req.query.wait !== "1") {
            if (req.get("If-None-Match") === tag()) return res.status(304).end();
            return sendCurrent();
        }
        // Strictly bounded number and lifetime of open requests, including on client disconnect.
        if (waiting.size >= 24) return res.set("Retry-After", "5").sendStatus(429);
        const timer = setTimeout(finish, WAIT_MS);
        function cleanup() {
            clearTimeout(timer);
            waiting.delete(finish);
            res.off("close", cleanup);
        }
        function finish() {
            cleanup();
            if (res.destroyed || res.writableEnded) return;
            if (!ready) return res.set("Retry-After", "5").sendStatus(503);
            if (since === ready.version) return res.status(204).end();
            return sendCurrent();
        }
        waiting.add(finish);
        res.once("close", cleanup);
    });
}

function watchRealtimeDatabase(profilesRef, fields = { Money: "money", Time: "playtime" }) {
    return (metric, publish, fail) => {
        const field = fields[metric];
        const query = profilesRef.orderByChild(field).limitToLast(LIMIT);
        function updated(snapshot) {
            const rows = [];
            snapshot.forEach(child => {
                rows.push({ id: child.key, value: child.child(field).val() });
            });
            publish(rows);
        }
        query.on("value", updated, fail);
        return () => query.off("value", updated);
    };
}

function watchFirestore(collection, fields = { Money: "money", Time: "playtime" }, idField) {
    return (metric, publish, fail) => {
        const field = fields[metric];
        return collection.orderBy(field, "desc").limit(LIMIT).onSnapshot(snapshot => {
            publish(snapshot.docs.map(doc => ({
                id: idField ? doc.get(idField) : doc.id,
                value: doc.get(field)
            })));
        }, fail);
    };
}

module.exports = { installPublicTop50, watchRealtimeDatabase, watchFirestore };
