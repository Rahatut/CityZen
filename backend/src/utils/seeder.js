        const { Category, AuthorityCompany, AuthorityCompanyCategory, AuthorityCompanyAreas } = require('../models');
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
            { name: 'DNCC (Dhaka North City Corporation)', description: 'Handles municipal services in North Dhaka including road maintenance, waste management, streetlights, drainage, parks, and public infrastructure.' },
            { name: 'DSCC (Dhaka South City Corporation)', description: 'Handles municipal services in South Dhaka including road maintenance, waste management, streetlights, drainage, parks, and public infrastructure.' },
            { name: 'DESCO (Dhaka Electric Supply Company)', description: 'Manages electricity distribution and streetlight power supply in North Dhaka and Tongi, including fault repair, exposed wiring, and electrical safety issues.' },
            { name: 'DPDC (Dhaka Power Distribution Company)', description: 'Manages electricity distribution and streetlight power supply in South Dhaka, including fault repair, exposed wiring, and electrical safety issues.' },
            { name: 'DoE (Department of Environment)', description: 'Enforces environmental laws related to air, water, and noise pollution, illegal dumping, open burning, and environmental protection.' },
            { name: 'DWASA (Dhaka Water Supply & Sewerage Authority)', description: 'Responsible for water supply, sewerage, and drainage infrastructure in Dhaka, including water leaks, sewer overflow, and blocked drains.' },
            { name: 'GCC (Gazipur City Corporation)', description: 'Handles municipal services in Gazipur including road maintenance, waste management, streetlights, drainage, parks, and public infrastructure.' },
            { name: 'Gazipur Palli Bidyut Samity-1', description: 'Manages electricity distribution and streetlight power supply in Gazipur, including fault repair, exposed wiring, and electrical safety issues.' },
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
            { companyName: 'DWASA (Dhaka Water Supply & Sewerage Authority)', categoryNames: ['Water Supply & Drains'] },
            { companyName: 'GCC (Gazipur City Corporation)', categoryNames: ['Roads & Transport', 'Garbage & Waste Management', 'Streetlights & Electrical', 'Water Supply & Drains', 'Buildings & Infrastructure', 'Environment & Public Spaces'] }, 
            { companyName: 'Gazipur Palli Bidyut Samity-1', categoryNames: ['Streetlights & Electrical'] }
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

        // Seed authority company areas into database
        const authorityAreasToSeed = [
            { companyName: 'DNCC (Dhaka North City Corporation)', name: 'Dhaka North', latitude: 23.796780, longitude: 90.408002, radius: 5.80 }, 
            { companyName: 'DSCC (Dhaka South City Corporation)',  name: 'Dhaka South', latitude: 23.724371, longitude: 90.409020, radius: 3.75 }, 
            { companyName: 'DESCO (Dhaka Electric Supply Company)', name: 'Gulshan', latitude: 23.792094, longitude: 90.412353, radius: 2.5 },         
            { companyName: 'DESCO (Dhaka Electric Supply Company)', name: 'Mirpur', latitude: 23.815226, longitude: 90.363270, radius: 4.65 },         
            { companyName: 'DESCO (Dhaka Electric Supply Company)', name: 'Uttara', latitude: 23.876022, longitude: 90.379263, radius: 2.65 },         
            { companyName: 'DPDC (Dhaka Power Distribution Company)', name: 'Dhaka South', latitude: 23.724371, longitude: 90.409020, radius: 3.75 },         
            { companyName: 'DoE (Department of Environment)', name: 'Dhaka', latitude: 23.812794, longitude: 90.414865, radius: 15.45 },         
            { companyName: 'DWASA (Dhaka Water Supply & Sewerage Authority)', name: 'Dhaka', latitude: 23.812794, longitude: 90.414865, radius: 15.45 },
            { companyName: 'GCC (Gazipur City Corporation)', name: 'Gazipur', latitude: 23.991012, longitude: 90.386507, radius: 6.30 }, 
            { companyName: 'Gazipur Palli Bidyut Samity-1', name: 'Gazipur', latitude: 23.991012, longitude: 90.386507, radius: 6.30 }
        ];
        
        for (const mapping of authorityAreasToSeed) {
            const authorityCompanyId = companyMap[mapping.companyName];
            if (authorityCompanyId) {
                await AuthorityCompanyAreas.findOrCreate({
                    where: {
                        authorityCompanyId: authorityCompanyId,
                        name: mapping.name
                    },
                    defaults: {
                        authorityCompanyId: authorityCompanyId,
                        name: mapping.name,
                        latitude: mapping.latitude,
                        longitude: mapping.longitude,
                        radius: mapping.radius
                    }
                });
            }   
        }         
        logger.info("Authority Company Area relations seeded");

    } catch (error) {
        logger.error("Seeding error: ", error.message);
        throw error; // Pass it back to startServer
    }
}

module.exports = seedDatabase;