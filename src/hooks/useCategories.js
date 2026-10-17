import { useEffect, useState } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  getArchivedCategories,
  restoreCategory,
} from "../services/categoryService";

// Everything the Categories screen needs: data, search, form, and actions.
export function useCategories({ authUser, module }) {
  const [categories, setCategories] = useState([]);
  const [archivedCategories, setArchivedCategories] = useState([]);
  const [categoryView, setCategoryView] = useState("active");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");

  useEffect(() => {
    if (!authUser || module !== "categories") return;

    let cancelled = false;

    async function load() {
      setCategoryLoading(true);
      setCategoryError("");
      try {
        const data =
          categoryView === "active"
            ? await getCategories()
            : await getArchivedCategories();
        if (!cancelled) {
          if (categoryView === "active") setCategories(data);
          else setArchivedCategories(data);
        }
      } catch (err) {
        if (!cancelled) setCategoryError(err.message);
      } finally {
        if (!cancelled) setCategoryLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [module, categoryView, authUser]);

  const displayedCategories =
    categoryView === "active" ? categories : archivedCategories;
  const filteredCategories = displayedCategories.filter((c) =>
    `${c.name} ${c.description || ""}`
      .toLowerCase()
      .includes(categorySearch.toLowerCase()),
  );

  // Category handlers
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryError("");
    setCategorySuccess("");
    if (!categoryName.trim()) {
      setCategoryError("Category name is required.");
      return;
    }
    const normalizedCategoryName = categoryName.trim().toLocaleLowerCase();
    const duplicateCategory = [...categories, ...archivedCategories].some(
      (category) =>
        category._id !== editingCategory?._id &&
        String(category.name || "")
          .trim()
          .toLocaleLowerCase() === normalizedCategoryName,
    );
    if (duplicateCategory) {
      setCategoryError(
        "A category with this name already exists. Category names are not case-sensitive.",
      );
      return;
    }
    setCategorySaving(true);
    try {
      const payload = {
        name: categoryName.trim(),
        description: categoryDescription.trim(),
      };
      if (editingCategory) {
        const updated = await updateCategory(editingCategory._id, payload);
        setCategories((old) =>
          old
            .map((x) => (x._id === updated._id ? updated : x))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setCategorySuccess(`${updated.name} updated successfully.`);
      } else {
        const created = await createCategory(payload);
        setCategories((old) =>
          [...old, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setCategorySuccess(`${created.name} added.`);
      }
      setCategoryName("");
      setCategoryDescription("");
      setEditingCategory(null);
      setShowCategoryForm(false);
    } catch (err) {
      setCategoryError(err.message);
    } finally {
      setCategorySaving(false);
    }
  };

  const startEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name || "");
    setCategoryDescription(category.description || "");
    setCategoryError("");
    setCategorySuccess("");
    setShowCategoryForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryError("");
  };

  const handleArchiveCategory = async (c) => {
    if (!window.confirm(`Archive "${c.name}"?`)) return;
    try {
      await archiveCategory(c._id);
      setCategories((old) => old.filter((x) => x._id !== c._id));
      setCategorySuccess(`${c.name} archived.`);
      setCategoryError("");
    } catch (err) {
      setCategoryError(err.message);
    }
  };

  const handleRestoreCategory = async (c) => {
    if (!window.confirm(`Restore "${c.name}"?`)) return;
    try {
      const restored = await restoreCategory(c._id);
      setArchivedCategories((old) => old.filter((x) => x._id !== c._id));
      setCategories((old) =>
        [...old, restored].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setCategorySuccess(`${c.name} restored.`);
      setCategoryError("");
    } catch (err) {
      setCategoryError(err.message);
    }
  };

  const changeCategoryView = (view) => {
    setCategoryView(view);
    setCategorySearch("");
  };

  // The "+ Add Category" button opens the form, or closes it if it is already open.
  const toggleCategoryForm = () => {
    if (showCategoryForm) {
      cancelCategoryForm();
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setCategoryDescription("");
      setCategoryError("");
      setShowCategoryForm(true);
    }
  };

  // Called when the user switches to another screen.
  const resetFeedback = () => {
    setCategoryError("");
    setCategorySuccess("");
    setShowCategoryForm(false);
  };

  return {
    displayedCategories,
    filteredCategories,
    categoryView,
    changeCategoryView,
    categorySearch,
    setCategorySearch,
    categoryName,
    setCategoryName,
    categoryDescription,
    setCategoryDescription,
    showCategoryForm,
    editingCategory,
    categoryLoading,
    categorySaving,
    categoryError,
    categorySuccess,
    toggleCategoryForm,
    handleCreateCategory,
    startEditCategory,
    cancelCategoryForm,
    handleArchiveCategory,
    handleRestoreCategory,
    resetFeedback,
  };
}
