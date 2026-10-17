
import { apiRequest } from "./api";

const API_URL = "/stock-movements";

export const getStockMovements = async () => {
  const data = await apiRequest(API_URL);

  return Array.isArray(data) ? data : data.movements || [];
};
