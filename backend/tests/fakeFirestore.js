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

const makeCollection = (db, path) => {
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
    orderBy: (field, direction = 'asc') => ({
      get: async () => {
        const docs = Array.from(col._docs.entries())
          .map(([id, data]) => ({ id, data: () => data }))
          .sort((a, b) => {
            const av = a.data()[field];
            const bv = b.data()[field];
            if (av === bv) return 0;
            return direction === 'desc' ? (av > bv ? -1 : 1) : av > bv ? 1 : -1;
          });
        return { docs };
      },
    }),
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
