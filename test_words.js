const words = require('an-array-of-portuguese-words');
console.log(`Total words: ${words.length}`);
console.log(`Sample: ${words.slice(0, 10).join(', ')}`);
console.log(`Sample Medium: ${words.filter(w => w.length >= 6 && w.length <= 10).slice(0, 5).join(', ')}`);
console.log(`Sample Hard: ${words.filter(w => w.length > 10).slice(0, 5).join(', ')}`);
