const { Category, AuthorityCompany, AuthorityCompanyCategory } = require('../models');
const logger = require('./logger');

async function seedDatabase() {
    try {
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

        const authorityCategoriesToSeed = [
            { authorityCompanyId: 1, categoryId: 1 }, 
            { authorityCompanyId: 1, categoryId: 2 }, 
            { authorityCompanyId: 1, categoryId: 3 }, 
            { authorityCompanyId: 1, categoryId: 4 }, 
            { authorityCompanyId: 1, categoryId: 5 }, 
            { authorityCompanyId: 1, categoryId: 6 }, 
            { authorityCompanyId: 2, categoryId: 1 },
            { authorityCompanyId: 2, categoryId: 2 },
            { authorityCompanyId: 2, categoryId: 3 },
            { authorityCompanyId: 2, categoryId: 4 },
            { authorityCompanyId: 2, categoryId: 5 },
            { authorityCompanyId: 2, categoryId: 6 }, 
            { authorityCompanyId: 3, categoryId: 3 },         
            { authorityCompanyId: 4, categoryId: 3 },         
            { authorityCompanyId: 5, categoryId: 6 },         
            { authorityCompanyId: 6, categoryId: 4 }
        ];         

        for (const authorityCategoryData of authorityCategoriesToSeed) {
            await AuthorityCompanyCategory.findOrCreate({
                where: {
                    authorityCompanyId: authorityCategoryData.authorityCompanyId,
                    categoryId: authorityCategoryData.categoryId
                },
                defaults: authorityCategoryData
            });
        }         
        logger.info("Authority Company Categories relations seeded");
    } catch (error) {
        logger.error("Seeding error: ", error.message);
        throw error; // Pass it back to startServer
    }
}

module.exports = seedDatabase;