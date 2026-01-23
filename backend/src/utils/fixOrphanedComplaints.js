const { Complaint, Category, sequelize } = require('../models');
const logger = require('./logger');

async function fixOrphanedComplaints() {
  try {
    logger.info('Starting orphaned complaints fix...');

    // Find all complaints with invalid categoryId
    const allComplaints = await Complaint.findAll({
      include: [{
        model: Category,
        required: false
      }]
    });

    const orphaned = allComplaints.filter(c => c.categoryId && !c.Category);
    
    if (orphaned.length === 0) {
      logger.info('No orphaned complaints found');
      return { fixed: 0, total: allComplaints.length };
    }

    logger.info(`Found ${orphaned.length} orphaned complaints`);

    // Get or create "Uncategorized" category
    const [uncategorized] = await Category.findOrCreate({
      where: { name: 'Uncategorized' },
      defaults: { 
        name: 'Uncategorized', 
        description: 'General complaints without specific category' 
      }
    });

    // Update all orphaned complaints
    const orphanedIds = orphaned.map(c => c.id);
    await Complaint.update(
      { categoryId: uncategorized.id },
      { where: { id: orphanedIds } }
    );

    logger.info(`Fixed ${orphaned.length} orphaned complaints - reassigned to "Uncategorized"`);
    
    return { 
      fixed: orphaned.length, 
      total: allComplaints.length,
      uncategorizedId: uncategorized.id 
    };
  } catch (error) {
    logger.error('Error fixing orphaned complaints:', error.message);
    throw error;
  }
}

module.exports = fixOrphanedComplaints;
