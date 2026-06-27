const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function createDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`);
        console.log(`Database ${process.env.DB_NAME} created or already exists.`);
    } catch (err) {
        console.error('Error creating database:', err);
    } finally {
        await connection.end();
    }
}

createDatabase();
