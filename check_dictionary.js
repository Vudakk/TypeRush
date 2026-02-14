const allWords = require('an-array-of-portuguese-words');

const suspicious = allWords.filter(w => w === 'rredutivelmente' || w.startsWith('rr') || w.startsWith('ss'));
console.log('Suspicious words:', suspicious);

const wordExists = allWords.includes('irredutivelmente');
console.log('Exists "irredutivelmente":', wordExists);
