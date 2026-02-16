const { sequelize, Complaint } = require('../src/models');

async function setComplaintStale(complaintId) {
    try {
        await sequelize.authenticate();

        if (!complaintId) {
            console.log("No ID provided. Listing last 10 complaints:");
            const complaints = await Complaint.findAll({
                limit: 10,
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'title', 'currentStatus', 'createdAt']
            });

            console.table(complaints.map(c => ({
                ID: c.id,
                Title: c.title,
                Status: c.currentStatus,
                Created: c.createdAt.toISOString().split('T')[0]
            })));

            console.log("\nUsage: node scripts/set-complaint-stale.js <ID>");
            process.exit(0);
        }

        console.log(`Looking for complaint ID: ${complaintId}`);
        const complaint = await Complaint.findByPk(complaintId);

        if (!complaint) {
            console.error(`Complaint with ID ${complaintId} not found!`);
            process.exit(1);
        }

        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

        // Update timestamps to make it stale (> 3 days old)
        // We also set lastBumpedAt to null so it's eligible to be bumped again
        await complaint.update({
            createdAt: fourDaysAgo,
            updatedAt: fourDaysAgo,
            lastAuthorityActivityAt: fourDaysAgo,
            lastBumpedAt: null
        });

        console.log(`✅ Complaint ${complaintId} updated!`);
        console.log(`- Created At: ${fourDaysAgo.toISOString()}`);
        console.log(`- Last Activity: ${fourDaysAgo.toISOString()}`);
        console.log(`- Status: ${complaint.currentStatus}`);
        console.log(`You can now try to submit a duplicate of this complaint to trigger the Bump option.`);

        process.exit(0);
    } catch (err) {
        console.error('Error updating complaint:', err);
        process.exit(1);
    }
}

const id = process.argv[2];
setComplaintStale(id);
