const { sequelize } = require('../src/models');

async function syncDatabase() {
    try {
        console.log('Authenticating...');
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        console.log('Syncing database with { alter: true }...');
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

syncDatabase();
