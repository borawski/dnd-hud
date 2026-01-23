#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const migrationsDir = __dirname;

// Get all migration files in order
const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.match(/^\d{3}_.*\.js$/) && file !== 'run-all.js')
    .sort();

console.log('Starting database migrations...\n');

for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    console.log(`Running ${file}...`);

    try {
        execSync(`node "${filePath}"`, { stdio: 'inherit' });
        console.log('');
    } catch (err) {
        console.error(`Failed to run ${file}`);
        process.exit(1);
    }
}

console.log('All migrations completed successfully!');
