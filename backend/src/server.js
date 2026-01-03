const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

console.log('Loaded DATABASE_URL:', process.env.DATABASE_URL || '(not found)');

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const { sequelize } = require('./models'); 
const logger = require('./utils/logger');
const env = require('./config/env');
const seedDatabase = require('./utils/seeder'); // Import the seeder logic

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const aiRoutes = require('./routes/aiRoutes');
const errorHandler = require('./middleware/errorHandler');

async function startServer() {
    try {
        // -------------------------------
        // Test database connection
        // -------------------------------
        await sequelize.authenticate();
        logger.info("Database connection successful");

        // Sync models
        await sequelize.sync({ alter: true }); 
        logger.info("Models synced");

        // Run the seeding logic
        await seedDatabase();

    } catch (err) {
        logger.error("Database initialization failed: ", err.message);
    }

    // -------------------------------
    // Express app
    // -------------------------------
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({
            ok: true,
            env: env.nodeEnv || "unknown",
            dbConnected: sequelize?.config ? true : false
        });
    });

    // API Routes
    app.use('/api', authRoutes); 
    app.use('/api', complaintRoutes);
    app.use('/api/ai', aiRoutes);

    // Static folder
    app.use('/public', express.static(path.join(__dirname, 'public')));

    // Error handler
    app.use(errorHandler);

    const port = env.port || 3000;
    app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
    });
}

// Start server
startServer().catch((err) => {
    console.error("Fatal error starting server:", err);
    process.exit(1);
});