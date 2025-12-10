import { randomUUID } from 'crypto';

const makeDocRef = (collection, id) => {
  if (!id) id = randomUUID();
  return {
    id,
    _collection: collection,
    set: (data, opts = {}) => {
      const existing = collection._docs.get(id) || {};
      const next = opts.merge ? { ...existing, ...data } : data;
      collection._docs.set(id, next);
    },
    get: () => {
      const data = collection._docs.get(id);
      return { exists: !!data, data: () => data };
    },
    delete: () => collection._docs.delete(id),
    collection: (name) => collection._db.collection(`${collection.path}/${id}/${name}`),
  };
};

const applyFilters = (docs, filters) => {
  if (!filters.length) return docs;
  return docs.filter((entry) =>
    filters.every(({ field, op, value }) => {
      const current = entry.data()[field];
      if (op === '==') return current === value;
      if (op === '>=') return current >= value;
      if (op === '<=') return current <= value;
      return false;
    }),
  );
};

const makeCollection = (db, path) => {
  const buildQuery = (col, filters = [], order = null, limitVal = null) => ({
    where: (field, op, value) => buildQuery(col, [...filters, { field, op, value }], order, limitVal),
    orderBy: (field, direction = 'asc') =>
      buildQuery(col, filters, { field, direction }, limitVal),
    limit: (n) => buildQuery(col, filters, order, n),
    get: async () => {
      let docs = Array.from(col._docs.entries()).map(([id, data]) => ({ id, data: () => data }));
      docs = applyFilters(docs, filters);
      if (order) {
        docs.sort((a, b) => {
          const av = a.data()[order.field];
          const bv = b.data()[order.field];
          if (av === bv) return 0;
          return order.direction === 'desc' ? (av > bv ? -1 : 1) : av > bv ? 1 : -1;
        });
      }
      if (Number.isFinite(limitVal)) {
        docs = docs.slice(0, limitVal);
      }
      return { docs };
    },
  });

  const col = {
    _db: db,
    path,
    _docs: new Map(),
    doc: (id) => makeDocRef(col, id),
    add: (data) => {
      const ref = makeDocRef(col);
      ref.set(data);
      return ref;
    },
    where: (field, op, value) => buildQuery(col, [{ field, op, value }]),
    orderBy: (field, direction = 'asc') => buildQuery(col, [], { field, direction }),
    get: async () => {
      const docs = Array.from(col._docs.entries()).map(([id, data]) => ({ id, data: () => data }));
      return { docs };
    },
    listDocuments: async () => Array.from(col._docs.keys()).map((id) => makeDocRef(col, id)),
  };
  return col;
};

export const createFakeDb = () => {
  const collections = new Map();
  const db = {
    collection: (name) => {
      if (!collections.has(name)) {
        collections.set(name, makeCollection(db, name));
      }
      return collections.get(name);
    },
    runTransaction: async (fn) =>
      fn({
        get: async (docRef) => docRef.get(),
        set: (docRef, data, opts) => docRef.set(data, opts),
      }),
    batch: () => {
      const ops = [];
      return {
        set: (ref, data, opts) => ops.push(() => ref.set(data, opts)),
        delete: (ref) => ops.push(() => ref.delete()),
        commit: async () => ops.forEach((op) => op()),
      };
    },
    _reset: () => collections.clear(),
  };
  return db;
};
