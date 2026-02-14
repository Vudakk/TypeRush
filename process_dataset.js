const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');

const inputFile = 'datasets/blogset_v2.csv.gz';
const outputFile = 'src/data/words.json';

// Limites de frases por categoria para não deixar o arquivo gigante
const LIMIT_PER_CATEGORY = 1000;

const phrases = {
    facil: [],
    medio: [],
    dificil: []
};

// Regex para limpeza
const urlRegex = /(https?:\/\/[^\s]+)/g;
const symbolRegex = /[^a-zA-Z0-9\s.,?!áàâãéèêíïóôõöúüçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ-]/g;

async function processFile() {
    console.log('Iniciando processamento (v2 - filtros rigorosos)...');

    if (!fs.existsSync(inputFile)) {
        console.error('Arquivo de entrada não encontrado!');
        return;
    }

    const fileStream = fs.createReadStream(inputFile);
    const unzip = zlib.createGunzip();

    const rl = readline.createInterface({
        input: fileStream.pipe(unzip),
        crlfDelay: Infinity
    });

    let processedLines = 0;

    for await (const line of rl) {
        processedLines++;
        if (processedLines % 100000 === 0) console.log(`Processadas ${processedLines} linhas...`);

        let text = line;

        // 1. Converter para minúsculas (Pedido do usuário)
        text = text.toLowerCase();

        // 2. Limpeza básica
        text = text.replace(urlRegex, '').trim();

        // 3. FILTRO RIGOROSO (Allowlist)
        // Só permite: letras (a-z + acentos), espaço, vírgula, ponto, exclamação, interrogação.
        // Rejeita: números, aspas, parenteses, traços, etc.
        // Regex verifica se existe qualquer caractere QUE NÃO SEJA permitido.
        const invalidCharRegex = /[^a-záàâãéèêíïóôõöúüç ,.!?]/;
        if (invalidCharRegex.test(text)) continue;

        // 4. Anti-spam de caracteres repetidos (ex: "Veeeeento", "Kkkkk")
        // Se tiver 3 ou mais caracteres idênticos seguidos, ignora a frase inteira
        if (/(.)\1{2,}/.test(text)) continue;

        // 5. Deve começar com letra (embora o filtro 3 já garanta que não tem caracteres estranhos no inicio, pode ter espaço ou pontuação)
        if (!/^[a-záàâãéèêíïóôõöúüç]/.test(text)) continue;

        // 6. Tamanho
        const len = text.length;
        if (len < 20 || len > 150) continue; // Ignora muito curtas ou muito longas

        if (len < 50 && phrases.facil.length < LIMIT_PER_CATEGORY) {
            phrases.facil.push(text);
        } else if (len >= 50 && len < 100 && phrases.medio.length < LIMIT_PER_CATEGORY) {
            phrases.medio.push(text);
        } else if (len >= 100 && phrases.dificil.length < LIMIT_PER_CATEGORY) {
            phrases.dificil.push(text);
        }

        // Se encheu tudo, para
        if (phrases.facil.length >= LIMIT_PER_CATEGORY &&
            phrases.medio.length >= LIMIT_PER_CATEGORY &&
            phrases.dificil.length >= LIMIT_PER_CATEGORY) {
            break;
        }
    }

    console.log('Processamento concluído!');
    console.log(`Fácil: ${phrases.facil.length}`);
    console.log(`Médio: ${phrases.medio.length}`);
    console.log(`Difícil: ${phrases.dificil.length}`);

    // Carregar JSON existente
    const currentData = require('./src/data/words.json');

    // Adicionar frases
    currentData.frases = phrases;

    // Salvar
    fs.writeFileSync(outputFile, JSON.stringify(currentData, null, 4));
    console.log('words.json atualizado com sucesso!');
}

processFile();
