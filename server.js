const path = require("path");
const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
}).promise();

function createApp(database = pool) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  app.post("/register", async (request, response) => {
    const {
      student_name,
      registration_number,
      email,
      department,
      year_of_study,
      event_name
    } = request.body;

    const requiredFields = [
      student_name,
      registration_number,
      email,
      department,
      year_of_study,
      event_name
    ];

    if (requiredFields.some((field) => !field || !String(field).trim())) {
      return response.status(400).json({ message: "All fields are required" });
    }

    try {
      const sql = `
        INSERT INTO registrations
          (student_name, registration_number, email, department, year_of_study, event_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      await database.execute(sql, [
        student_name.trim(),
        registration_number.trim(),
        email.trim(),
        department.trim(),
        year_of_study.trim(),
        event_name.trim()
      ]);

      return response.status(201).json({ message: "Registration successful" });
    } catch (error) {
      console.error("Registration insert failed:", error.message);
      return response.status(500).json({ message: "Unable to save registration" });
    }
  });

  app.get("/registrations", async (request, response) => {
    try {
      const sql = `
        SELECT student_name, registration_number, email, department, year_of_study, event_name
        FROM registrations
        ORDER BY created_at DESC
      `;
      const [rows] = await database.execute(sql);

      return response.json(rows);
    } catch (error) {
      console.error("Registration list failed:", error.message);
      return response.status(500).json({ message: "Unable to load registrations" });
    }
  });

  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 80;
  createApp().listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = { createApp };
