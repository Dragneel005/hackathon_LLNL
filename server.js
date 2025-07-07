// server.js
// This is the backend server for the inventory management system.
// To run this:
// 1. Make sure you have Node.js installed.
// 2. In your terminal, in the same directory as this file, run: npm install express sqlite3 cors
// 3. Then run: node server.js
// The server will start on http://localhost:4000

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 4000;

// --- Middleware ---
app.use(cors()); // Allows our React app to talk to this server
app.use(express.json()); // Allows server to understand JSON data in request bodies

// --- Database Setup ---
// This will create a new file 'inventory.db' if it doesn't exist.
const db = new sqlite3.Database('./inventory.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create tables if they don't exist
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS devices (
                DOE TEXT NOT NULL UNIQUE PRIMARY KEY,
                PC/MAC TEXT NOT NULL,
                notes TEXT,
                status TEXT NOT NULL DEFAULT 'Available',
                currentUser TEXT,
                checkOutDate INTEGER
            )`, (err) => {
                if (err) console.error("Error creating devices table:", err.message);
            });

            db.run(`CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deviceId INTEGER NOT NULL,
                userName TEXT NOT NULL,
                checkOutDate INTEGER NOT NULL,
                checkInDate INTEGER,
                FOREIGN KEY (deviceId) REFERENCES devices (id)
            )`, (err) => {
                if (err) console.error("Error creating history table:", err.message);
            });
        });
    }
});


// --- API Endpoints ---

// GET /api/devices - Get all devices
app.get('/api/devices', (req, res) => {
    const sql = "SELECT * FROM devices ORDER BY model";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// POST /api/devices - Add a new device
app.post('/api/devices', (req, res) => {
    const { serialNumber, model, notes } = req.body;
    if (!serialNumber || !model) {
        res.status(400).json({ "error": "Missing required fields: serialNumber and model" });
        return;
    }
    const sql = `INSERT INTO devices (serialNumber, model, notes, status) VALUES (?, ?, ?, 'Available')`;
    db.run(sql, [serialNumber, model, notes], function(err) {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.status(201).json({
            "message": "success",
            "data": { id: this.lastID, ...req.body, status: 'Available' }
        });
    });
});

// POST /api/devices/:id/checkout - Check out a device
app.post('/api/devices/:id/checkout', (req, res) => {
    const deviceId = req.params.id;
    const { userName } = req.body;
    if (!userName) {
        res.status(400).json({ "error": "Missing required field: userName" });
        return;
    }

    const checkOutTimestamp = Date.now();

    db.serialize(() => {
        // Start a transaction
        db.run("BEGIN TRANSACTION");

        // Update the device status
        const updateDeviceSql = `UPDATE devices SET status = 'Checked Out', currentUser = ?, checkOutDate = ? WHERE id = ? AND status = 'Available'`;
        db.run(updateDeviceSql, [userName, checkOutTimestamp, deviceId], function(err) {
            if (err) {
                db.run("ROLLBACK");
                res.status(500).json({ "error": err.message });
                return;
            }
            // Check if any row was actually updated
            if (this.changes === 0) {
                 db.run("ROLLBACK");
                 res.status(409).json({ "error": "Device is not available for checkout or does not exist." });
                 return;
            }

            // Create a new history record
            const insertHistorySql = `INSERT INTO history (deviceId, userName, checkOutDate) VALUES (?, ?, ?)`;
            db.run(insertHistorySql, [deviceId, userName, checkOutTimestamp], (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    res.status(500).json({ "error": err.message });
                    return;
                }
                // Commit the transaction
                db.run("COMMIT");
                res.json({ "message": "success", "data": { deviceId, userName, checkOutDate: checkOutTimestamp } });
            });
        });
    });
});

// POST /api/devices/:id/checkin - Check in a device
app.post('/api/devices/:id/checkin', (req, res) => {
    const deviceId = req.params.id;
    const checkInTimestamp = Date.now();

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Update device status
        const updateDeviceSql = `UPDATE devices SET status = 'Available', currentUser = NULL, checkOutDate = NULL WHERE id = ? AND status = 'Checked Out'`;
        db.run(updateDeviceSql, [deviceId], function(err) {
            if (err) {
                db.run("ROLLBACK");
                res.status(500).json({ "error": err.message });
                return;
            }
             if (this.changes === 0) {
                 db.run("ROLLBACK");
                 res.status(409).json({ "error": "Device is not checked out or does not exist." });
                 return;
            }

            // Find the latest open history record for this device and update it
            const updateHistorySql = `
    UPDATE history
    SET checkInDate = ?
    WHERE id = (
        SELECT id
        FROM history
        WHERE deviceId = ? AND checkInDate IS NULL
        ORDER BY checkOutDate DESC
        LIMIT 1
    )
`;
            db.run(updateHistorySql, [checkInTimestamp, deviceId], (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    res.status(500).json({ "error": err.message });
                    return;
                }
                db.run("COMMIT");
                res.json({ "message": "success" });
            });
        });
    });
});

// GET /api/devices/:id/history - Get history for a specific device
app.get('/api/devices/:id/history', (req, res) => {
    const deviceId = req.params.id;
    const sql = "SELECT * FROM history WHERE deviceId = ? ORDER BY checkOutDate DESC";
    db.all(sql, [deviceId], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
