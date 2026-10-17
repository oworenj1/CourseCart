
const jwt = require("jsonwebtoken");
const Account = require("../models/Accounts.cjs");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const account = await Account.findById(decoded.id);

    if (!account || account.status !== "active" || account.isArchived) {
      return res.status(401).json({
        message: "Account is unavailable. Please contact an administrator.",
      });
    }

    req.user = {
      id: account._id.toString(),
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      role: account.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
