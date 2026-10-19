
import { apiRequest } from "./api";

const API_URL = "/purchase-orders";

// The service unwraps common response shapes so the hook can work with order records directly.
export const getPurchaseOrders = async () => {
  const data = await apiRequest(API_URL);

  return Array.isArray(data) ? data : data.orders || [];
};

export const createPurchaseOrder = async (orderData) => {
  const data = await apiRequest(API_URL, {
    method: "POST",
    body: JSON.stringify(orderData),
  });

  return data.order || data;
};

export const receiveStock = async (orderId, receivingData) => {
  return apiRequest(`${API_URL}/${orderId}/receive`, {
    method: "POST",
    body: JSON.stringify(receivingData),
  });
};
