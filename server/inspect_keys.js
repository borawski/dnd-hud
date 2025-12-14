const fs = require('fs');

const data = JSON.parse(fs.readFileSync('character_dump.json', 'utf8'));
console.log('Keys in data:', Object.keys(data.data));

if (data.data.classes) {
    console.log('Found classes!');
    console.log(JSON.stringify(data.data.classes, null, 2).substring(0, 500));
} else {
    console.log('Classes not found in data root.');
}
