const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 4000;
const mongoUrl = process.env.DB_URL;

// Enable CORS for frontend
app.use(cors({
    origin: ['http://localhost:3000', 'https://bazarxpress-server.onrender.com'],
    credentials: true
}));
// Parse JSON bodies
app.use(bodyParser.json());

let dbClient;

async function connectToMongo() {
    try {
        dbClient = new MongoClient(mongoUrl);
        await dbClient.connect();
        app.locals.db = dbClient.db();
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    }
}

// Mount all API routes under /api
// /api/auth/* and /api/users/* endpoints
app.use('/api/auth', authRoutes);

// Health check route
app.get("/", (req, res) => {
    res.send("Server is running and connected to MongoDB!");
});

// Global error handler
app.use(errorHandler);

// Connect to MongoDB and start server
connectToMongo().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});