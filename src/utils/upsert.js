const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function upsertProducts(collection, products, keyField) {
  const now = new Date();
  const ops = products
    .filter((p) => p[keyField])
    .map((p) => ({
      updateOne: {
        filter: { [keyField]: p[keyField] },
        update: {
          $set: { ...p, lastSeenAt: now },
          $setOnInsert: { firstSeenAt: now },
        },
        upsert: true,
      },
    }));
  if (ops.length) await collection.bulkWrite(ops);
  return ops.length;
}

async function findRecent(collection) {
  const cutoff = new Date(Date.now() - ONE_WEEK_MS);
  // Newest-discovered first: firstSeenAt never changes on re-crawls, so a
  // deal's position reflects when it was found, not when it was last re-seen.
  return collection
    .find({ lastSeenAt: { $gte: cutoff } }, { projection: { _id: 0 } })
    .sort({ firstSeenAt: -1 })
    .toArray();
}

module.exports = { upsertProducts, findRecent, ONE_WEEK_MS };
