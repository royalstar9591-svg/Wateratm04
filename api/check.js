import admin from "firebase-admin";

// Firebase init (Vercel env se)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_KEY)
    ),
    databaseURL: process.env.FIREBASE_DB
  });
}

const db = admin.database();

export default async function handler(req, res) {
  const { uid, reader } = req.query;

  // validation
  if (!uid || !reader) {
    return res.json({
      status: "error",
      message: "uid or reader missing"
    });
  }

  try {
    // customers read
    const snap = await db.ref("customers").once("value");
    const customers = snap.val() || {};

    let registered = false;

    for (let key in customers) {
      const c = customers[key];
      if (
        String(c.Rfid1) === String(uid) ||
        String(c.Rfid2) === String(uid) ||
        String(c.Rfid3) === String(uid)
      ) {
        registered = true;
        break;
      }
    }

    if (!registered) {
      return res.json({
        status: "notFound",
        message: "UID not registered"
      });
    }

    // relay = reader number
    const relay = Number(reader);

    // settings path
    const node =
      relay === 1 ? "relay1" :
      relay === 2 ? "relay2" :
      "Relay3";

    const setSnap = await db.ref("settings/" + node).once("value");
    const seconds = setSnap.val()?.Time || 0;

    return res.json({
      status: "success",
      relay: relay,
      seconds: seconds
    });

  } catch (err) {
    return res.json({
      status: "error",
      message: err.toString()
    });
  }
}