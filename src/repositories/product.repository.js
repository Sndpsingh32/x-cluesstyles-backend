export const createProductRepository = ({ db }) =>
  Object.freeze({
    findAll: (filters = {}) => db.products.findAll(filters),
    findById: (id) => db.products.findById(id),
    findBySlug: (slug) => db.products.findBySlug(slug),
    existsBySlug: (slug, excludeId = null) => db.products.existsBySlug(slug, excludeId),
    create: (data) => db.products.create(data),
    update: (id, fields) => db.products.update(id, fields),
    delete: (id) => db.products.delete(id),
  });
