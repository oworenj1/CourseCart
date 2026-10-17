
import { apiRequest } from "./api";

const API_URL = "/products";

export const getProducts = async () => {
  return apiRequest(API_URL);
};

export const createProduct = async (productData) => {
  const data = await apiRequest(API_URL, {
    method: "POST",
    body: JSON.stringify(productData),
  });

  return data.product;
};

export const updateProduct = async (id, productData) => {
  const data = await apiRequest(`${API_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(productData),
  });

  return data.product;
};

export const archiveProduct = async (id) => {
  const data = await apiRequest(`${API_URL}/${id}/archive`, {
    method: "PATCH",
  });

  return data.product;
};

export const getArchivedProducts = async () => {
  return apiRequest(`${API_URL}/archived`);
};

export const restoreProduct = async (id) => {
  const data = await apiRequest(`${API_URL}/${id}/restore`, {
    method: "PATCH",
  });

  return data.product;
};
