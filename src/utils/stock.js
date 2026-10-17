// Products with stock at or below their reorder level count as "low stock".
export const DEFAULT_REORDER_LEVEL = 10;

export const isLowStock = (product) =>
  Number(product.stock) <=
  Number(product.reorderLevel ?? DEFAULT_REORDER_LEVEL);
