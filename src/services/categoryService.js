import { apiRequest } from "./api";

const API_URL = "/categories";

export const getCategories = async () => {
  return apiRequest(API_URL);
};

export const createCategory = async (categoryData) => {
  const data = await apiRequest(API_URL, {
    method: "POST",
    body: JSON.stringify(categoryData),
  });
  return data.category;
};

export const updateCategory = async (id, categoryData) => {
  const data = await apiRequest(`${API_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(categoryData),
  });
  return data.category;
};

export const getArchivedCategories = async () => {
  return apiRequest(`${API_URL}/archived`);
};

export const archiveCategory = async (id) => {
  const data = await apiRequest(`${API_URL}/${id}/archive`, {
    method: "PATCH",
  });
  return data.category;
};

export const restoreCategory = async (id) => {
  const data = await apiRequest(`${API_URL}/${id}/restore`, {
    method: "PATCH",
  });
  return data.category;
};