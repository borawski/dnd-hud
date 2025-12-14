const axios = require('axios');
const fs = require('fs');

async function fetchCharacter() {
    try {
        const url = 'https://character-service.dndbeyond.com/character/v5/character/48690485';
        console.log(`Fetching ${url}...`);
        const { data } = await axios.get(url);

        console.log('Data fetched. Saving to character_dump.json...');
        fs.writeFileSync('character_dump.json', JSON.stringify(data, null, 2));
        console.log('Done.');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

fetchCharacter();
