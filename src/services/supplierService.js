import { apiRequest } from "./api";

const API_URL = "/suppliers";

export const getSuppliers = async () => {
  return apiRequest(API_URL);
};

export const createSupplier = async (supplierData) => {
  const data = await apiRequest(API_URL, {
    method: "POST",
    body: JSON.stringify(supplierData),
  });
  return data.supplier;
};

export const updateSupplier = async (id, supplierData) => {
  const data = await apiRequest(`${API_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(supplierData),
  });
  return data.supplier;
};

export const getArchivedSuppliers = async () => {
  return apiRequest(`${API_URL}/archived`);
};

export const archiveSupplier = async (id) => {
  const data = await apiRequest(`${API_URL}/${id}/archive`, {
    method: "PATCH",
  });
  return data.supplier;
};

export const restoreSupplier = async (id) => {
  const data = await apiRequest(`${API_URL}/${id}/restore`, {
    method: "PATCH",
  });
  return data.supplier;
};