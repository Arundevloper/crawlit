const { MongoClient } = require('mongodb');
const { mongoUri, mongoDbName } = require('./config');

let client;
let db;

async function connectDB() {
  if (db) return db;
  if (!mongoUri) throw new Error('MONGO_URI is not set');

  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db(mongoDbName);

  await Promise.all([
    db.collection('amazon_products').createIndex({ url: 1 }, { unique: true }),
    db.collection('amazon_deals').createIndex({ asin: 1 }, { unique: true }),
    db.collection('flipkart_products').createIndex({ url: 1 }, { unique: true }),
  ]);

  console.log(`Connected to MongoDB database "${mongoDbName}"`);
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
}

async function closeDB() {
  if (client) await client.close();
  db = undefined;
}

module.exports = { connectDB, getDb, closeDB };
