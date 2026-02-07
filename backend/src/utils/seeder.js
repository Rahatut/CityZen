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
            { name: 'Pothole', description: 'Damaged road surfaces causing vehicle damage, traffic disruption, and increased accident risk.' },
            { name: 'Broken Road', description: 'Severely damaged roads disrupting traffic flow and creating safety risks for commuters.' },
            { name: 'Waterlogged Roads', description: 'Flooded roads due to poor drainage causing traffic delays and pedestrian difficulties.' },
            { name: 'Broken Footpath', description: 'Damaged sidewalks creating walking hazards for pedestrians, elderly, and disabled individuals.' },
            { name: 'Open Manhole', description: 'Uncovered manholes posing serious safety risks to pedestrians, cyclists, and vehicles.' },
            { name: 'Garbage/Pollution', description: 'Uncollected waste causing environmental pollution, health hazards, and unpleasant urban conditions.' },
            { name: 'Broken Streetlight', description: 'Non-functional streetlights reducing visibility and increasing nighttime crime and accident risks.' },
            { name: 'Hanging Electrical Wires', description: 'Loose electrical wires creating electrocution, fire hazards, and public safety threats.' },
            { name: 'Drain Blockage', description: 'Blocked drains causing waterlogging, flooding, bad odor, and mosquito breeding.' },
            { name: 'Open Drain', description: 'Uncovered drains posing accident risks, health hazards, and sanitation problems.' },
            { name: 'Water Supply Leakage', description: 'Leaking pipes wasting water, damaging roads, and reducing supply pressure.' },
            { name: 'Risky Infrastructure', description: 'Unsafe or weakened structures posing collapse risks and public safety concerns.' },
            { name: 'Water Pollution', description: 'Polluted water bodies harming public health and damaging the environment.' }
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


        // Seed authority categories into database
        const authorityCategoriesToSeed = [
            { companyName: 'DNCC (Dhaka North City Corporation)', categoryNames: ['Pothole', 'Broken Road', 'Broken Footpath', 'Open Manhole', 'Garbage/Pollution', 'Broken Streetlight', 'Drain Blockage', 'Open Drain', 'Risky Infrastructure', 'Water Pollution'] },
            { companyName: 'DSCC (Dhaka South City Corporation)', categoryNames: ['Pothole', 'Broken Road', 'Broken Footpath', 'Open Manhole', 'Garbage/Pollution', 'Broken Streetlight', 'Drain Blockage', 'Open Drain', 'Risky Infrastructure', 'Water Pollution'] },
            { companyName: 'DESCO (Dhaka Electric Supply Company)', categoryNames: ['Broken Streetlight', 'Hanging Electrical Wires'] },
            { companyName: 'DPDC (Dhaka Power Distribution Company)', categoryNames: ['Broken Streetlight', 'Hanging Electrical Wires'] },
            { companyName: 'DoE (Department of Environment)', categoryNames: ['Garbage/Pollution', 'Water Pollution'] },
            { companyName: 'DWASA (Dhaka Water Supply & Sewerage Authority)', categoryNames: ['Waterlogged Roads', 'Drain Blockage', 'Open Drain', 'Water Supply Leakage', 'Water Pollution'] },
            { companyName: 'GCC (Gazipur City Corporation)', categoryNames: ['Pothole', 'Broken Road', 'Broken Footpath', 'Open Manhole', 'Garbage/Pollution', 'Broken Streetlight', 'Drain Blockage', 'Open Drain', 'Risky Infrastructure', 'Water Pollution'] },
            { companyName: 'Gazipur Palli Bidyut Samity-1', categoryNames: ['Broken Streetlight', 'Hanging Electrical Wires'] }
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