/**
 * SavedDesign repository — owns all persistence details for saved designs.
 * Services never contain DB-specific code.
 */
export const createSavedDesignRepository = ({ db }) =>
  Object.freeze({
    findAllByUser:  (userId, filters)    => db.savedDesigns.findAllByUser(userId, filters),
    findById:       (id)                 => db.savedDesigns.findById(id),
    create:         (data)               => db.savedDesigns.create(data),
    update:         (id, fields)         => db.savedDesigns.update(id, fields),
    softDelete:     (id)                 => db.savedDesigns.softDelete(id),
    countByUser:    (userId)             => db.savedDesigns.countByUser(userId),
  });
