import { useEffect, useState } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  archiveProduct,
  getArchivedProducts,
  restoreProduct,
} from "../services/productService";
import { getCategories } from "../services/categoryService";

const emptyProduct = {
  name: "",
  category: "",
  price: "",
  stock: "0",
};

// Everything the Products screen needs: data, search, form, and actions.
export function useProducts({ authUser, module }) {
  const [products, setProducts] = useState([]);
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [productView, setProductView] = useState("active");
  const [productSearch, setProductSearch] = useState("");
  const [productForm, setProductForm] = useState(emptyProduct);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState("");
  const [productSuccess, setProductSuccess] = useState("");
  const [categories, setCategories] = useState([]);

  // Products need both the selected inventory list and active categories for the form.
  useEffect(() => {
    if (!authUser || module !== "products") return;

    let cancelled = false;

    async function load() {
      setProductLoading(true);
      setProductError("");
      try {
        const [data, activeCategories] = await Promise.all([
          productView === "active" ? getProducts() : getArchivedProducts(),
          getCategories(),
        ]);
        if (!cancelled) {
          if (productView === "active") setProducts(data);
          else setArchivedProducts(data);
          setCategories(
            Array.isArray(activeCategories) ? activeCategories : [],
          );
        }
      } catch (err) {
        if (!cancelled) setProductError(err.message);
      } finally {
        if (!cancelled) setProductLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [module, productView, authUser]);

  // Search applies to the currently selected active/archive list.
  const displayedProducts =
    productView === "active" ? products : archivedProducts;
  const filteredProducts = displayedProducts.filter((p) =>
    `${p.name} ${p.category}`
      .toLowerCase()
      .includes(productSearch.toLowerCase()),
  );

  // Product handlers
  const openEditProduct = (p) => {
    setProductForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      stock: String(p.stock),
    });
    setEditingId(p._id);
    setProductError("");
    setProductSuccess("");
    setShowProductForm(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setProductError("");
    setProductSuccess("");
    // Check required values, uniqueness, active category, price, and stock before saving.
    if (!productForm.name.trim() || !productForm.category.trim()) {
      setProductError("Product name and category are required.");
      return;
    }
    const normalizedProductName = productForm.name.trim().toLocaleLowerCase();
    const duplicateProduct = [...products, ...archivedProducts].some(
      (product) =>
        product._id !== editingId &&
        String(product.name || "")
          .trim()
          .toLocaleLowerCase() === normalizedProductName,
    );
    if (duplicateProduct) {
      setProductError(
        "A product with this name already exists. Product names are not case-sensitive.",
      );
      return;
    }
    if (
      !categories.some(
        (category) =>
          String(category.name || "")
            .trim()
            .toLocaleLowerCase() ===
          productForm.category.trim().toLocaleLowerCase(),
      )
    ) {
      setProductError("Please select an active category from the dropdown.");
      return;
    }
    if (
      productForm.price.trim() === "" ||
      !Number.isFinite(Number(productForm.price)) ||
      Number(productForm.price) < 0
    ) {
      setProductError("Enter a valid non-negative price.");
      return;
    }
    if (
      productForm.stock.trim() === "" ||
      !Number.isInteger(Number(productForm.stock)) ||
      Number(productForm.stock) < 0
    ) {
      setProductError("Stock must be a non-negative whole number.");
      return;
    }
    // Send normalized values to the service, then reflect the saved record in the list.
    setProductSaving(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        category: productForm.category.trim(),
        price: Number(productForm.price),
        // Stock is not editable in this form. Keep the current value when editing;
        // new products start at zero and receive stock through the inventory workflow.
        stock: editingId ? Number(productForm.stock) : 0,
      };
      if (editingId) {
        const updated = await updateProduct(editingId, payload);
        setProducts((old) =>
          old.map((p) => (p._id === editingId ? updated : p)),
        );
        setProductSuccess("Product updated successfully.");
      } else {
        const created = await createProduct(payload);
        setProducts((old) =>
          [...old, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setProductSuccess("Product added successfully.");
      }
      setShowProductForm(false);
      setEditingId(null);
      setProductForm(emptyProduct);
    } catch (err) {
      setProductError(err.message);
    } finally {
      setProductSaving(false);
    }
  };

  const handleArchiveProduct = async (p) => {
    if (!window.confirm(`Archive "${p.name}"?`)) return;
    try {
      await archiveProduct(p._id);
      setProducts((old) => old.filter((x) => x._id !== p._id));
      setProductSuccess(`${p.name} archived.`);
      setProductError("");
    } catch (err) {
      setProductError(err.message);
    }
  };

  const handleRestoreProduct = async (p) => {
    if (!window.confirm(`Restore "${p.name}"?`)) return;
    try {
      const restored = await restoreProduct(p._id);
      setArchivedProducts((old) => old.filter((x) => x._id !== p._id));
      setProducts((old) =>
        [...old, restored].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setProductSuccess(`${p.name} restored.`);
      setProductError("");
    } catch (err) {
      setProductError(err.message);
    }
  };

  const changeProductView = (view) => {
    setProductView(view);
    setProductSearch("");
  };

  const openAddProduct = () => {
    setProductForm(emptyProduct);
    setEditingId(null);
    setProductError("");
    setShowProductForm(true);
  };

  const closeProductForm = () => setShowProductForm(false);

  // Called when the user switches to another screen.
  const resetFeedback = () => {
    setProductError("");
    setProductSuccess("");
    setShowProductForm(false);
  };

  return {
    displayedProducts,
    filteredProducts,
    productView,
    changeProductView,
    productSearch,
    setProductSearch,
    productForm,
    setProductForm,
    showProductForm,
    editingId,
    productLoading,
    productSaving,
    productError,
    productSuccess,
    categories,
    openAddProduct,
    closeProductForm,
    openEditProduct,
    saveProduct,
    handleArchiveProduct,
    handleRestoreProduct,
    resetFeedback,
  };
}
