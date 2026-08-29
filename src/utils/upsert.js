const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_HISTORY = 30;

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const n = Number(String(value).replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
}

async function upsertProducts(collection, products, keyField) {
  const now = new Date();
  const ops = products
    .filter((p) => p[keyField])
    .map((p) => {
      const priceValue = toNumber(p.price);
      return {
        updateOne: {
          filter: { [keyField]: p[keyField] },
          // Aggregation-pipeline update so a price point is appended only when
          // the price actually changed. Re-crawling an unchanged product every
          // 30 minutes must not pad the history with duplicates.
          update: [
            {
              $set: {
                ...p,
                priceValue,
                lastSeenAt: now,
                firstSeenAt: { $ifNull: ['$firstSeenAt', now] },
                priceHistory: {
                  $let: {
                    vars: { prev: { $ifNull: ['$priceHistory', []] } },
                    in: {
                      $cond: [
                        {
                          $or: [
                            { $eq: [priceValue, null] },
                            { $eq: [{ $last: '$$prev.price' }, priceValue] },
                          ],
                        },
                        '$$prev',
                        {
                          $slice: [
                            { $concatArrays: ['$$prev', [{ price: priceValue, at: now }]] },
                            -MAX_HISTORY,
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
          ],
          upsert: true,
        },
      };
    });
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
