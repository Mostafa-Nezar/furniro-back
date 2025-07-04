const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Create test app
const app = express();

app.use(express.json());
app.use(cors());

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Test admin route
app.get('/api/admin/test', (req, res) => {
    res.json({ message: 'Admin routes are configured!' });
});

// Test notifications route
app.get('/api/notifications/test', (req, res) => {
    res.json({ message: 'Notifications routes are configured!' });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Test server running at http://localhost:${PORT}`);
});

