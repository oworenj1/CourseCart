
import { apiRequest } from "./api";

const API_URL = "/stock-movements";

// Stock movements are read here; receiving and checkout create them on the backend.
export const getStockMovements = async () => {
  const data = await apiRequest(API_URL);

  return Array.isArray(data) ? data : data.movements || [];
};
