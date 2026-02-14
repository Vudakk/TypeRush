const fs = require('fs');

// Carregar palavras do arquivo lexico
const rawData = fs.readFileSync('temp_words/lexico', 'utf8');
const allWords = rawData.split('\n').map(w => w.trim()).filter(w => w.length > 0);

console.log(`Total raw words: ${allWords.length}`);

// Validar palavras
const isValidWord = w => {
    // 1. Sem 'rr' ou 'ss' no início
    // 2. Apenas letras e hífens
    // 3. Tamanho mínimo 3
    if (/^(rr|ss)/i.test(w)) return false;
    if (!/^[a-záàâãéèêíïóôõöúüç-]+$/i.test(w)) return false;
    return true;
};

// Categorizar
const facil = []; // Manual list from current words.json (user request)
const medio = [];
const dificil = [];

// Carregar palavras fáceis manuais existentes para não perder
const currentWords = require('./src/data/words.json');
const manualFacil = currentWords.facil || [];

// Filtrar e distribuir
allWords.forEach(w => {
    if (!isValidWord(w)) return;

    const len = w.length;

    // User logic:
    // Facil: Manual list (keep existing)
    // Medio: 6-10 chars (from dictionary)
    // Dificil: >10 chars (from dictionary)

    if (len >= 6 && len <= 10) {
        medio.push(w);
    } else if (len > 10) {
        dificil.push(w);
    }
});

console.log(`Facil (Manual): ${manualFacil.length}`);
console.log(`Medio (Dictionary): ${medio.length}`);
console.log(`Dificil (Dictionary): ${dificil.length}`);

// Criar novo objeto JSON
const newWordsData = {
    facil: manualFacil,
    medio: medio,
    dificil: dificil
};

// Salvar
fs.writeFileSync('src/data/words.json', JSON.stringify(newWordsData, null, 4));
console.log('src/data/words.json updated successfully!');
