import * as icons from 'lucide-react';

const requiredIcons = [
    'Search', 'Plus', 'ChevronDown', 'ChevronRight', 'Minus', // MonsterSearch
    'Link2', // AddPlayer
    'ArrowLeft', 'LogOut', // Navbar
    'Play', 'RotateCcw', 'Sword', // InitiativeTracker
    'Trash2', 'Shield', 'Zap', 'X', 'Scroll', 'Dice5' // InitiativeTrackerDetail
];

console.log('Checking lucide-react exports...');
const missing = requiredIcons.filter(icon => !icons[icon]);

if (missing.length > 0) {
    console.error('MISSING ICONS:', missing);
    process.exit(1);
} else {
    console.log('All icons found!');
}
