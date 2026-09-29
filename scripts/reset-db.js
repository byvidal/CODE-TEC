const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/greenhouse.db');
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log("Database deleted.");
}
require('./init-db.js');
setTimeout(() => require('./seed-db.js'), 500); // small delay to ensure init is done
