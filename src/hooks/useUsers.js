import { useEffect, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  archiveUser,
  restoreUser,
} from "../services/userService";

const emptyUserForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "cashier",
  status: "active",
};

// Everything the User Management screen needs (Admin only).
export function useUsers({ authUser, module }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSaving, setUsersSaving] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [usersSuccess, setUsersSuccess] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [usersView, setUsersView] = useState("active");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState(emptyUserForm);

  useEffect(() => {
    if (module !== "users" || authUser?.role !== "admin") return;

    let cancelled = false;

    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError("");
      try {
        const allUsers = await getUsers(usersView === "archived");
        if (!cancelled) {
          setUsers(
            usersView === "archived"
              ? allUsers.filter((user) => user.isArchived)
              : allUsers.filter((user) => !user.isArchived),
          );
        }
      } catch (err) {
        if (!cancelled)
          setUsersError(err.message || "Failed to load user accounts.");
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [module, usersView, authUser]);

  const displayedUsers = users.filter((user) =>
    [user.firstName, user.lastName, user.email, user.role, user.status]
      .join(" ")
      .toLowerCase()
      .includes(usersSearch.trim().toLowerCase()),
  );

  const openEditUser = (user) => {
    const targetId = user.id || user._id;
    if (targetId === authUser?.id) {
      setUsersError(
        "You cannot edit your own Admin account. Ask another Admin to manage it, or have another Admin deactivate it and create a replacement account if needed.",
      );
      return;
    }
    setEditingUserId(targetId);
    setUserForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: "",
      role: user.role || "cashier",
      status: user.status || "active",
    });
    setUsersError("");
    setUsersSuccess("");
    setShowUserForm(true);
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setUsersError("");
    setUsersSuccess("");
    if (
      !userForm.firstName.trim() ||
      !userForm.lastName.trim() ||
      !userForm.email.trim()
    ) {
      setUsersError("First name, last name, and email are required.");
      return;
    }
    if (!editingUserId && userForm.password.length < 8) {
      setUsersError("Password must be at least 8 characters long.");
      return;
    }
    if (userForm.password && userForm.password.length < 8) {
      setUsersError("A new password must be at least 8 characters long.");
      return;
    }

    setUsersSaving(true);
    try {
      const payload = {
        firstName: userForm.firstName.trim(),
        lastName: userForm.lastName.trim(),
        email: userForm.email.trim().toLowerCase(),
        role: userForm.role,
        status: userForm.status,
      };
      if (userForm.password) payload.password = userForm.password;

      const result = editingUserId
        ? await updateUser(editingUserId, payload)
        : await createUser({ ...payload, password: userForm.password });

      const savedUser = result.user;
      setUsers((previous) => {
        const id = savedUser.id || savedUser._id;
        const exists = previous.some((user) => (user.id || user._id) === id);
        return exists
          ? previous.map((user) =>
              (user.id || user._id) === id ? savedUser : user,
            )
          : [savedUser, ...previous];
      });
      setUsersSuccess(
        result.message ||
          (editingUserId
            ? "User updated successfully."
            : "User created successfully."),
      );
      setShowUserForm(false);
      setEditingUserId(null);
      setUserForm(emptyUserForm);
    } catch (err) {
      setUsersError(err.message || "Unable to save user account.");
    } finally {
      setUsersSaving(false);
    }
  };

  const toggleUserStatus = async (user) => {
    const id = user.id || user._id;
    if (id === authUser?.id) {
      setUsersError("You cannot deactivate your own account.");
      return;
    }
    const nextStatus = user.status === "active" ? "inactive" : "active";
    if (
      !window.confirm(
        `${nextStatus === "active" ? "Activate" : "Deactivate"} ${user.firstName} ${user.lastName}?`,
      )
    )
      return;
    setUsersError("");
    setUsersSuccess("");
    try {
      const result = await updateUser(id, { status: nextStatus });
      setUsers((previous) =>
        previous.map((item) =>
          (item.id || item._id) === id ? result.user : item,
        ),
      );
      setUsersSuccess(result.message || `Account ${nextStatus}.`);
    } catch (err) {
      setUsersError(err.message || "Unable to update account status.");
    }
  };

  const archiveOrRestoreUser = async (user) => {
    const id = user.id || user._id;
    if (!user.isArchived && id === authUser?.id) {
      setUsersError("You cannot archive your own account.");
      return;
    }
    const restoring = Boolean(user.isArchived);
    if (
      !window.confirm(
        `${restoring ? "Restore" : "Archive"} ${user.firstName} ${user.lastName}?`,
      )
    )
      return;
    setUsersError("");
    setUsersSuccess("");
    try {
      const result = restoring ? await restoreUser(id) : await archiveUser(id);
      // Either way, the account leaves the list it was shown in.
      setUsers((previous) =>
        previous.filter((item) => (item.id || item._id) !== id),
      );
      setUsersSuccess(
        result.message ||
          `User account ${restoring ? "restored" : "archived"} successfully.`,
      );
    } catch (err) {
      setUsersError(err.message || "Unable to update archived account.");
    }
  };

  const changeUsersView = (view) => {
    setUsersView(view);
    setUsersSearch("");
    setUsersError("");
    setUsersSuccess("");
    setShowUserForm(false);
  };

  // The "+ Add User" button opens a blank form, or closes it if it is already open.
  const toggleUserForm = () => {
    setEditingUserId(null);
    setUserForm(emptyUserForm);
    setUsersError("");
    setUsersSuccess("");
    setShowUserForm((old) => !old);
  };

  const cancelUserForm = () => {
    setShowUserForm(false);
    setEditingUserId(null);
    setUserForm(emptyUserForm);
    setUsersError("");
  };

  return {
    users,
    usersLoading,
    usersSaving,
    usersError,
    usersSuccess,
    usersSearch,
    setUsersSearch,
    usersView,
    showUserForm,
    editingUserId,
    userForm,
    setUserForm,
    displayedUsers,
    changeUsersView,
    toggleUserForm,
    cancelUserForm,
    openEditUser,
    saveUser,
    toggleUserStatus,
    archiveOrRestoreUser,
  };
}
