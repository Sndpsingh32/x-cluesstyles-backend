export const createCategoryRepository = ({ db }) =>
  Object.freeze({
    findAll:             (filters)        => db.categories.findAll(filters),
    findById:            (id)             => db.categories.findById(id),
    findBySlug:          (slug)           => db.categories.findBySlug(slug),
    findByIdWithChildren:(id)             => db.categories.findByIdWithChildren(id),
    findTree:            ()               => db.categories.findTree(),
    existsBySlug:        (slug, excl)     => db.categories.existsBySlug(slug, excl),
    create:              (data)           => db.categories.create(data),
    update:              (id, fields)     => db.categories.update(id, fields),
    delete:              (id)             => db.categories.delete(id),
  });

export const createSubCategoryRepository = ({ db }) =>
  Object.freeze({
    findAll:             (filters)        => db.subcategories.findAll(filters),
    findById:            (id)             => db.subcategories.findById(id),
    findBySlug:          (slug)           => db.subcategories.findBySlug(slug),
    findByIdWithChildren:(id)             => db.subcategories.findByIdWithChildren(id),
    existsBySlug:        (slug, excl)     => db.subcategories.existsBySlug(slug, excl),
    create:              (data)           => db.subcategories.create(data),
    update:              (id, fields)     => db.subcategories.update(id, fields),
    delete:              (id)             => db.subcategories.delete(id),
  });

export const createSubSubCategoryRepository = ({ db }) =>
  Object.freeze({
    findAll:             (filters)        => db.subsubcategories.findAll(filters),
    findById:            (id)             => db.subsubcategories.findById(id),
    findBySlug:          (slug)           => db.subsubcategories.findBySlug(slug),
    existsBySlug:        (slug, excl)     => db.subsubcategories.existsBySlug(slug, excl),
    create:              (data)           => db.subsubcategories.create(data),
    update:              (id, fields)     => db.subsubcategories.update(id, fields),
    delete:              (id)             => db.subsubcategories.delete(id),
  });
