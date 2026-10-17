const ActivityLog = require("../models/ActivityLogs.cjs");

const PATH_ENTITY_MAP = [
  ["/api/users", "account"],
  ["/api/products", "product"],
  ["/api/categories", "category"],
  ["/api/suppliers", "supplier"],
  ["/api/purchase-orders", "purchaseOrder"],
  ["/api/sales", "sale"],
  ["/api/stock-movements", "stockMovement"],
];

function getEntityType(path) {
  const entry = PATH_ENTITY_MAP.find(([prefix]) => path.startsWith(prefix));
  return entry ? entry[1] : "system";
}

function getAction(method, path) {
  const segments = path.split("?")[0].split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "system";

  if (last === "checkout") return "completed_sale";
  if (last === "receive") return "received_stock";
  if (last === "archive") return "archived_record";
  if (last === "restore") return "restored_record";
  if (segments.includes("users") && method === "POST") return "created_account";
  if (segments.includes("users") && ["PUT", "PATCH"].includes(method)) return "updated_account";
  if (segments.includes("products") && method === "POST") return "created_product";
  if (segments.includes("products") && ["PUT", "PATCH"].includes(method)) return "updated_product";
  if (segments.includes("categories") && method === "POST") return "created_category";
  if (segments.includes("categories") && ["PUT", "PATCH"].includes(method)) return "updated_category";
  if (segments.includes("suppliers") && method === "POST") return "created_supplier";
  if (segments.includes("purchase-orders") && method === "POST") return "created_purchase_order";

  const methodName = ({
    POST: "created",
    PUT: "updated",
    PATCH: "updated",
    DELETE: "deleted",
  })[method] || "changed";

  return `${methodName}_${segments[segments.length - 2] || last}`.replace(/-/g, "_");
}

function getEntityId(req) {
  const paramsId = req.params && req.params.id;
  // Do not inspect or store request bodies: they may contain credentials or payment data.
  return paramsId && /^[a-f\d]{24}$/i.test(String(paramsId)) ? paramsId : null;
}

function activityLogger(req, res, next) {
  const method = req.method;
  const path = req.path;

  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }

  if (!path.startsWith("/api/") || path.startsWith("/api/auth")) {
    return next();
  }

  // The finish event fires after route middleware has run, so req.user can be populated
  // by the route's protect middleware before we build the log record.
  res.once("finish", async () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    try {
      const userId = req.user && req.user.id ? req.user.id : null;
      const entityType = getEntityType(path);
      const action = getAction(method, path);
      const details = `${method} ${path}`.slice(0, 500);

      await ActivityLog.create({
        user: userId,
        action,
        entityType,
        entityId: getEntityId(req),
        details,
      });

      console.log(`[ActivityLog] Saved ${action} (${entityType})`);
    } catch (error) {
      console.error("[ActivityLog] Failed to save:", error.message);
    }
  });

  next();
}

module.exports = activityLogger;
