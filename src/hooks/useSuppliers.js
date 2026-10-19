import { useEffect, useState } from "react";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  archiveSupplier,
  getArchivedSuppliers,
  restoreSupplier,
} from "../services/supplierService";

const emptySupplier = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
};

// Everything the Suppliers screen needs: data, search, form, and actions.
export function useSuppliers({ authUser, module }) {
  const [suppliers, setSuppliers] = useState([]);
  const [archivedSuppliers, setArchivedSuppliers] = useState([]);
  const [supplierView, setSupplierView] = useState("active");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierSaving, setSupplierSaving] = useState(false);
  const [supplierError, setSupplierError] = useState("");
  const [supplierSuccess, setSupplierSuccess] = useState("");

  // Load the active or archived supplier list when this screen or its view changes.
  useEffect(() => {
    if (!authUser || module !== "suppliers") return;

    let cancelled = false;

    async function load() {
      setSupplierLoading(true);
      setSupplierError("");
      try {
        const data =
          supplierView === "active"
            ? await getSuppliers()
            : await getArchivedSuppliers();
        if (!cancelled) {
          if (supplierView === "active") setSuppliers(data);
          else setArchivedSuppliers(data);
        }
      } catch (err) {
        if (!cancelled) setSupplierError(err.message);
      } finally {
        if (!cancelled) setSupplierLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [module, supplierView, authUser]);

  // Search all supplier contact fields so users can find an account by any saved detail.
  const displayedSuppliers =
    supplierView === "active" ? suppliers : archivedSuppliers;
  const filteredSuppliers = displayedSuppliers.filter((s) =>
    [s.name, s.contactPerson, s.phone, s.email, s.address].some((v) =>
      (v || "").toLowerCase().includes(supplierSearch.toLowerCase()),
    ),
  );

  // Supplier handlers
  const handleSupplierChange = (e) => {
    const { name, value } = e.target;
    setSupplierForm((old) => ({ ...old, [name]: value }));
    setSupplierError("");
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setSupplierError("");
    setSupplierSuccess("");
    // Require a name and prevent duplicates across both active and archived records.
    if (!supplierForm.name.trim()) {
      setSupplierError("Supplier name is required.");
      return;
    }
    const normalizedName = supplierForm.name.trim().toLocaleLowerCase();
    const duplicate = [...suppliers, ...archivedSuppliers].some(
      (supplier) =>
        supplier._id !== editingSupplier?._id &&
        String(supplier.name || "")
          .trim()
          .toLocaleLowerCase() === normalizedName,
    );
    if (duplicate) {
      setSupplierError(
        "A supplier with this name already exists. Supplier names are not case-sensitive.",
      );
      return;
    }
    // Send trimmed form values, then update the visible list from the backend response.
    setSupplierSaving(true);
    try {
      const payload = {
        name: supplierForm.name.trim(),
        contactPerson: supplierForm.contactPerson.trim(),
        phone: supplierForm.phone.trim(),
        email: supplierForm.email.trim(),
        address: supplierForm.address.trim(),
      };
      if (editingSupplier) {
        const updated = await updateSupplier(editingSupplier._id, payload);
        setSuppliers((old) =>
          old
            .map((x) => (x._id === updated._id ? updated : x))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setSupplierSuccess(`${updated.name} updated successfully.`);
      } else {
        const created = await createSupplier(payload);
        setSuppliers((old) =>
          [...old, created].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setSupplierSuccess(`${created.name} added successfully.`);
      }
      setSupplierForm(emptySupplier);
      setEditingSupplier(null);
      setShowSupplierForm(false);
    } catch (err) {
      setSupplierError(err.message);
    } finally {
      setSupplierSaving(false);
    }
  };

  const startEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
    setSupplierError("");
    setSupplierSuccess("");
    setShowSupplierForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelSupplierForm = () => {
    setShowSupplierForm(false);
    setEditingSupplier(null);
    setSupplierForm(emptySupplier);
    setSupplierError("");
  };

  const handleArchiveSupplier = async (s) => {
    if (!window.confirm(`Archive "${s.name}"?`)) return;
    try {
      await archiveSupplier(s._id);
      setSuppliers((old) => old.filter((x) => x._id !== s._id));
      setSupplierSuccess(`${s.name} archived.`);
      setSupplierError("");
    } catch (err) {
      setSupplierError(err.message);
    }
  };

  const handleRestoreSupplier = async (s) => {
    if (!window.confirm(`Restore "${s.name}"?`)) return;
    try {
      const restored = await restoreSupplier(s._id);
      setArchivedSuppliers((old) => old.filter((x) => x._id !== s._id));
      setSuppliers((old) =>
        [...old, restored].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSupplierSuccess(`${s.name} restored.`);
      setSupplierError("");
    } catch (err) {
      setSupplierError(err.message);
    }
  };

  const changeSupplierView = (view) => {
    setSupplierView(view);
    setSupplierSearch("");
  };

  // The "+ Add Supplier" button opens the form, or closes it if it is already open.
  const toggleSupplierForm = () => {
    if (showSupplierForm) {
      cancelSupplierForm();
    } else {
      setEditingSupplier(null);
      setSupplierForm(emptySupplier);
      setSupplierError("");
      setShowSupplierForm(true);
    }
  };

  // Called when the user switches to another screen.
  const resetFeedback = () => {
    setSupplierError("");
    setSupplierSuccess("");
    setShowSupplierForm(false);
  };

  return {
    displayedSuppliers,
    filteredSuppliers,
    supplierView,
    changeSupplierView,
    supplierSearch,
    setSupplierSearch,
    supplierForm,
    handleSupplierChange,
    showSupplierForm,
    editingSupplier,
    supplierLoading,
    supplierSaving,
    supplierError,
    supplierSuccess,
    toggleSupplierForm,
    handleCreateSupplier,
    startEditSupplier,
    cancelSupplierForm,
    handleArchiveSupplier,
    handleRestoreSupplier,
    resetFeedback,
  };
}
