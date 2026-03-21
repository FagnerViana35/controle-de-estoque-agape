// Helper function to handle JSON Server-like query params (sorting and pagination)
export const applyQueryParams = async (queryBuilder, req, tableName) => {
  const { _sort, _per_page, _page } = req.query;
  let query = queryBuilder.clone();

  // Sorting
  if (_sort) {
    const isDesc = _sort.startsWith('-');
    const column = isDesc ? _sort.substring(1) : _sort;
    query = query.orderBy(column, isDesc ? 'desc' : 'asc');
  }

  // Pagination (JSON Server 1.0 style)
  if (_per_page) {
    const limit = parseInt(_per_page);
    const page = parseInt(_page) || 1;
    const offset = (page - 1) * limit;

    // Get total count for metadata
    const countResult = await queryBuilder.clone().count('* as total').first();
    const total = parseInt(countResult.total);
    const pages = Math.ceil(total / limit);

    const data = await query.limit(limit).offset(offset);

    return {
      data,
      items: total,
      pages,
      first: 1,
      prev: page > 1 ? page - 1 : null,
      next: page < pages ? page + 1 : null,
      last: pages
    };
  }

  // If no pagination, return the result directly
  return await query;
};
