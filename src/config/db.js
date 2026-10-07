const { MongoClient } = require('mongodb');
const { mongoUri, mongoDbName } = require('./config');

let client;
let db;

async function connectDB() {
  if (db) return db;
  if (!mongoUri) {
    throw new Error(
      'MONGO_URI is not set. Create a .env file in the project root (it is ' +
        'gitignored, so it is not deployed) — see .env.example for the format.',
    );
  }

  client = new MongoClient(mongoUri);
  await client.connect();
  db = client.db(mongoDbName);

  const collections = ['amazon_products', 'amazon_deals', 'flipkart_products', 'myntra_products'];

  await Promise.all([
    // Unique identity indexes
    db.collection('amazon_products').createIndex({ url: 1 }, { unique: true }),
    db.collection('amazon_deals').createIndex({ asin: 1 }, { unique: true }),
    db.collection('flipkart_products').createIndex({ url: 1 }, { unique: true }),
    db.collection('myntra_products').createIndex({ url: 1 }, { unique: true }),

    // High-performance query index for findRecent (filters by lastSeenAt, sorts by firstSeenAt)
    ...collections.map((col) =>
      db.collection(col).createIndex({ lastSeenAt: -1, firstSeenAt: -1 })
    ),

    // TTL index: automatically prune stale records older than 30 days
    ...collections.map((col) =>
      db.collection(col).createIndex(
        { lastSeenAt: 1 },
        { expireAfterSeconds: 30 * 24 * 60 * 60, name: 'ttl_stale_deals_30d' }
      )
    ),

    // Amazon product pages opened by the search crawler. Each run skips these,
    // so it only opens new products; after a day the entry expires and the
    // product can be re-opened to refresh its price.
    db.collection('amazon_seen').createIndex(
      { at: 1 },
      { expireAfterSeconds: 24 * 60 * 60, name: 'ttl_amazon_seen_1d' }
    ),
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
