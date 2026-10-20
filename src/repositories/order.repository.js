export const createOrderRepository = ({ db }) =>
  Object.freeze({
    findAll: (filters = {}) => db.orders.findAll(filters),
    findById: (id) => db.orders.findById(id),
    create: (data) => db.orders.create(data),
    update: (id, fields) => db.orders.update(id, fields),
    delete: (id) => db.orders.delete(id),
  });
