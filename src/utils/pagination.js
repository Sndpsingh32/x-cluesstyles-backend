export const createPagination = ({ page, limit, sortBy, sortOrder }, allowedSortFields) => {
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : allowedSortFields[0];
  return Object.freeze({
    page,
    limit,
    offset: (page - 1) * limit,
    sortBy: safeSortBy,
    sortOrder: sortOrder.toUpperCase(),
  });
};

export const createPageMeta = ({ page, limit, total }) => Object.freeze({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});
