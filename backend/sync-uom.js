// Quick script to sync UOM data from P6
const { cleanP6SyncService } = require('./services/cleanP6SyncService');

async function syncUOM() {
    console.log('Starting UOM sync...');
    try {
        const count = await cleanP6SyncService.syncUnitOfMeasures();
        console.log(`\n✓ Done! Synced ${count} units of measure`);
        process.exit(0);
    } catch (error) {
        console.error('Error syncing UOM:', error.message);
        process.exit(1);
    }
}

syncUOM();
