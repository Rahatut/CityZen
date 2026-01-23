const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const sequelize = require('../src/config/database');
const Complaint = require('../src/models/Complaint');

async function testUpdate() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const pendingComplaint = await Complaint.findOne({ where: { currentStatus: 'pending' } });

        if (!pendingComplaint) {
            console.log('No pending complaints found to test.');
            return;
        }

        console.log(`Found pending complaint ID: ${pendingComplaint.id}`);

        // Try to update to 'accepted'
        console.log("Attempting to update status to 'accepted'...");

        try {
            await pendingComplaint.update({ currentStatus: 'accepted' });
            console.log("SUCCESS: Complaint updated to 'accepted'.");

            // Ensure we can read it back
            await pendingComplaint.reload();
            console.log(`Verified Status in DB: ${pendingComplaint.currentStatus}`);

            // Revert it back so we don't mess up user data too much (optional)
            // await pendingComplaint.update({ currentStatus: 'pending' });
            // console.log("Reverted back to 'pending'.");
        } catch (err) {
            console.error("FAILURE: Could not update complaint status.");
            console.error("Error Name:", err.name);
            console.error("Error Message:", err.message);
            if (err.original) {
                console.error("Original SQL Error:", err.original.message);
            }
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

testUpdate();
