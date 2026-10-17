
import { apiRequest } from "./api";

const API_URL = "/sales";

export const createSale = async (saleData) => {
  return apiRequest(`${API_URL}/checkout`, {
    method: "POST",
    body: JSON.stringify(saleData),
  });
};

export const getSales = async () => {
  const data = await apiRequest(API_URL);

  return Array.isArray(data) ? data : data.sales || [];
};
