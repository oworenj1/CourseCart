
import { apiRequest } from "./api";

const API_URL = "/purchase-orders";

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
