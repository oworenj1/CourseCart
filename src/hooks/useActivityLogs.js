import { useEffect, useState } from "react";
import { getActivityLogs } from "../services/activityLogService";

// Loads the Activity Logs list (Admin only) and filters it by the search box.
export function useActivityLogs({ authUser, module }) {
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [activityLogsError, setActivityLogsError] = useState("");
  const [activityLogsSearch, setActivityLogsSearch] = useState("");

  // Load the protected audit list only when an Admin opens this module.
  useEffect(() => {
    if (module !== "activity-logs" || authUser?.role !== "admin") return;

    let cancelled = false;

    const loadActivityLogs = async () => {
      setActivityLogsLoading(true);
      setActivityLogsError("");
      try {
        const logs = await getActivityLogs();
        if (!cancelled) setActivityLogs(logs);
      } catch (err) {
        if (!cancelled)
          setActivityLogsError(err.message || "Failed to load activity logs.");
      } finally {
        if (!cancelled) setActivityLogsLoading(false);
      }
    };

    loadActivityLogs();
    return () => {
      cancelled = true;
    };
  }, [module, authUser]);

  // Match the search text against the action, record, detail, and account fields.
  const filteredActivityLogs = activityLogs.filter((log) => {
    const user = log.user || {};
    const userName = [user.firstName, user.lastName, user.email, user.role]
      .filter(Boolean)
      .join(" ");
    return [log.action, log.entityType, log.details, userName]
      .join(" ")
      .toLowerCase()
      .includes(activityLogsSearch.trim().toLowerCase());
  });

  return {
    activityLogs,
    activityLogsLoading,
    activityLogsError,
    activityLogsSearch,
    setActivityLogsSearch,
    filteredActivityLogs,
  };
}
