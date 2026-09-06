const { MongoClient } = require("mongodb");
const crypto = require("node:crypto");
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

function createStore(env = process.env) {
  let connection;
  async function collections() {
    if (!connection) {
      connection = (async () => {
        if (!env.MONGODB_URI) throw new Error("Missing MongoDB configuration");
        const client = new MongoClient(env.MONGODB_URI, { maxPoolSize: 3, serverSelectionTimeoutMS: 5000 });
        try {
          await client.connect();
          const db = client.db(env.BOOKMARK_DB || "nemo_bookmarks");
          const auth = db.collection("auth");
          await auth.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
          return { client, trees: db.collection("trees"), auth };
        } catch (error) { await client.close(); throw error; }
      })().catch((error) => { connection = null; throw error; });
    }
    return connection;
  }
  return {
    async getTree() {
      const { trees } = await collections();
      return trees.findOne({ _id: "public" }, { projection: { _id: 0 } });
    },
    async saveTree(version, nodes) {
      const { trees } = await collections();
      const result = await trees.updateOne({ _id: "public", version }, { $set: { nodes }, $inc: { version: 1 } });
      return result.matchedCount === 1;
    },
    async initialize(nodes) {
      const { trees } = await collections();
      const result = await trees.updateOne({ _id: "public" }, { $setOnInsert: { version: 1, nodes } }, { upsert: true });
      return result.upsertedCount === 1;
    },
    async putAuth(kind, token, data) {
      const { auth } = await collections();
      await auth.insertOne({ _id: `${kind}:${hash(token)}`, ...data });
    },
    async getAuth(kind, token, consume = false) {
      if (!token) return null;
      const { auth } = await collections();
      const query = { _id: `${kind}:${hash(token)}`, expiresAt: { $gt: new Date() } };
      return consume ? auth.findOneAndDelete(query) : auth.findOne(query);
    },
    async deleteAuth(kind, token) {
      const { auth } = await collections();
      await auth.deleteOne({ _id: `${kind}:${hash(token)}` });
    },
    async close() { if (connection) { const { client } = await connection; await client.close(); connection = null; } },
  };
}
module.exports = { createStore };
