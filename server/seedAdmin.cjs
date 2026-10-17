
require("dotenv").config();
const readline = require("readline/promises");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db.cjs");
const Account = require("./models/Accounts.cjs");

async function seedAdmin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    await connectDB();

    const firstName = await rl.question("Admin first name: ");
    const lastName = await rl.question("Admin last name: ");
    const email = (
      await rl.question("Admin email: ")
    ).trim().toLowerCase();
    const password = await rl.question("Admin password (8+ characters): ");

    if (!firstName.trim() || !lastName.trim()) {
      throw new Error("First and last name are required.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const existing = await Account.findOne({ email });

    if (existing) {
      throw new Error("An account with that email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await Account.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      password: hashedPassword,
      role: "admin",
      status: "active",
      isArchived: false,
    });

    console.log("\nAdmin account created successfully!");
    console.log("Account ID:", admin._id.toString());
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
  } catch (error) {
    console.error("\nCould not create admin:", error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

seedAdmin();
