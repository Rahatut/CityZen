const { Category, AuthorityCompany, AuthorityCompanyCategory } = require('../models');
const logger = require('./logger');

async function seedDatabase() {
    try {
        // Only seed if tables are empty (first-time setup)
        const categoryCount = await Category.count();
        const companyCount = await AuthorityCompany.count();

        if (categoryCount > 0 && companyCount > 0) {
            logger.info("Database already seeded, skipping...");
            return;
        }

        logger.info("Seeding database for first time...");

        // Seed categories into database
        const categoriesToSeed = [
            { name: 'Roads & Transport', description: 'Issues related to roads, traffic, and public transportation.' },
            { name: 'Garbage & Waste Management', description: 'Issues related to waste collection, illegal dumping, and recycling.' },
            { name: 'Streetlights & Electrical', description: 'Issues related to streetlights, power outages, and electrical hazards.' },
            { name: 'Water Supply & Drains', description: 'Issues related to water supply, sewage, and drainage systems.' },
            { name: 'Buildings & Infrastructure', description: 'Issues related to public buildings, bridges, and other infrastructure.' },
            { name: 'Environment & Public Spaces', description: 'Issues related to parks, green spaces, pollution, and environmental quality.' }
        ];

        const categoryMap = {};
        for (const categoryData of categoriesToSeed) {
            const [category] = await Category.findOrCreate({
                where: { name: categoryData.name },
                defaults: categoryData
            });
            categoryMap[categoryData.name] = category.id;
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

        const companyMap = {};
        for (const companyData of companiesToSeed) {
            const [company] = await AuthorityCompany.findOrCreate({
                where: { name: companyData.name },
                defaults: companyData
            });
            companyMap[companyData.name] = company.id;
        }
        logger.info("Companies seeded");

        const authorityCategoriesToSeed = [
            { companyName: 'DNCC (Dhaka North City Corporation)', categoryNames: ['Roads & Transport', 'Garbage & Waste Management', 'Streetlights & Electrical', 'Water Supply & Drains', 'Buildings & Infrastructure', 'Environment & Public Spaces'] }, 
            { companyName: 'DSCC (Dhaka South City Corporation)', categoryNames: ['Roads & Transport', 'Garbage & Waste Management', 'Streetlights & Electrical', 'Water Supply & Drains', 'Buildings & Infrastructure', 'Environment & Public Spaces'] }, 
            { companyName: 'DESCO (Dhaka Electric Supply Company)', categoryNames: ['Streetlights & Electrical'] },         
            { companyName: 'DPDC (Dhaka Power Distribution Company)', categoryNames: ['Streetlights & Electrical'] },         
            { companyName: 'DoE (Department of Environment)', categoryNames: ['Environment & Public Spaces'] },         
            { companyName: 'DWASA (Dhaka Water Supply & Sewerage Authority)', categoryNames: ['Water Supply & Drains'] }
        ];         

        for (const mapping of authorityCategoriesToSeed) {
            const authorityCompanyId = companyMap[mapping.companyName];
            for (const categoryName of mapping.categoryNames) {
                const categoryId = categoryMap[categoryName];
                if (authorityCompanyId && categoryId) {
                    await AuthorityCompanyCategory.findOrCreate({
                        where: {
                            authorityCompanyId,
                            categoryId
                        },
                        defaults: { authorityCompanyId, categoryId }
                    });
                }
            }
        }         
        logger.info("Authority Company Categories relations seeded");
    } catch (error) {
        logger.error("Seeding error: ", error.message);
        throw error; // Pass it back to startServer
    }
}

module.exports = seedDatabase;