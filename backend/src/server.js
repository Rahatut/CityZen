// Load env from project root (.env)
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

console.log('Loaded DATABASE_URL:', process.env.DATABASE_URL || '(not found)');

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

// CRITICAL CHANGE 1: Import sequelize from the models/index file
// This ensures all User, Citizen, Authority, and Admin models are loaded with associations.
const { sequelize, Category } = require('./models'); 
const logger = require('./utils/logger');
const env = require('./config/env');
// REMOVED: const sequelize = require('./config/database'); // Redundant after CRITICAL CHANGE 1
// REMOVED: const initFirebase = require('./config/firebase'); // Not needed for this client-auth flow

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const aiRoutes = require('./routes/aiRoutes');
const errorHandler = require('./middleware/errorHandler');
const AuthorityCompany = require('./models/AuthorityCompany');

async function startServer() {
	// -------------------------------
	// Initialize Firebase (REMOVED)
	// The Firebase client SDK logic is now handled entirely on the frontend (SignupScreen.js)
	// The Firebase Admin SDK is not strictly required for this specific registration flow.
	// -------------------------------
	
	// -------------------------------
	// Test database connection
	// -------------------------------
	try {
		await sequelize.authenticate();
		logger.info("Database connection successful");

		// CRITICAL CHANGE 2: Use { alter: true } to automatically create the new tables (User, Citizen, Authority, Admin)
		// and their foreign key relationships when the server starts.
		await sequelize.sync({ alter: true }); 
		logger.info("Models synced");

		// Seed categories into database
		const categoriesToSeed = [
			{ name: 'Roads & Transport', description: 'Issues related to roads, traffic, and public transportation.' },
			{ name: 'Garbage & Waste Management', description: 'Issues related to waste collection, illegal dumping, and recycling.' },
			{ name: 'Streetlights & Electrical', description: 'Issues related to streetlights, power outages, and electrical hazards.' },
			{ name: 'Water Supply & Drains', description: 'Issues related to water supply, sewage, and drainage systems.' },
			{ name: 'Buildings & Infrastructure', description: 'Issues related to public buildings, bridges, and other infrastructure.' },
			{ name: 'Environment & Public Spaces', description: 'Issues related to parks, green spaces, pollution, and environmental quality.' }
		];

		for (const categoryData of categoriesToSeed) {
			await Category.findOrCreate({
				where: { name: categoryData.name },
				defaults: categoryData
			});
		}
		logger.info("Categories seeded");

		// Seed authority companies into database
		const companiesToSeed = [
			{ name: 'DNCC (Dhaka North City Corporation)', description: 'Responsible for municipal services in North Dhaka including road maintenance, waste management, streetlights, drainage, parks, and public infrastructure.' },
			{ name: 'DSCC (Dhaka South City Corporation)', description: 'Handles municipal services in South Dhaka such as road repair, garbage collection, street lighting, drainage systems, and maintenance of public spaces.' },
			{ name: 'DESCO (Dhaka Electric Supply Company)', description: 'Manages electricity distribution and streetlight power supply in North Dhaka, including fault repair, exposed wiring, and electrical safety issues.' },
			{ name: 'DPDC (Dhaka Power Distribution Company)', description: 'Provides electricity distribution and maintenance services in South Dhaka, handling power outages, faulty streetlights, and electrical hazards.' },
			{ name: 'DoE (Department of Environment)', description: 'Enforces environmental laws related to air, water, and noise pollution, illegal dumping, open burning, and environmental protection.' },
			{ name: 'DWASA (Dhaka Water Supply & Sewerage Authority)', description: 'Responsible for water supply, sewerage, and drainage infrastructure in Dhaka, including water leaks, sewer overflow, and blocked drains.' }
		]; 

		for (const companyData of companiesToSeed) {
			await AuthorityCompany.findOrCreate({
				where: { name: companyData.name },
				defaults: companyData
			});
		}
		logger.info("Companies seeded");

	} catch (err) {
		logger.error("Database connection failed:", err.message);
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
    // CRITICAL CHANGE 3: Changed route mounting from '/api/auth' to '/api'
    // This correctly maps the frontend call (POST /api/users) to the route defined in authRoutes.js
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