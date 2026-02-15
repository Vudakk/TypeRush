const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const wordsData = require('../data/words.json');
const fs = require('fs');
const path = require('path');

// Map para armazenar jogos ativos
const activeGames = new Map();

// Função para gerar palavra com anti-cheat (Zero Width Space)
function getAntiCheatWord(word) {
    return word.split('').join('\u200B');
}

// Gerador de números aleatórios
function generateNumber(length) {
    let result = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Gerador de problemas matemáticos
function generateMath(difficulty) {
    const operators = ['+', '-', '*'];
    let op, n1, n2, expr;

    if (difficulty === 'easy') {
        // Soma e Subtração simples (1-20)
        op = Math.random() < 0.5 ? '+' : '-';
        n1 = Math.floor(Math.random() * 20) + 1;
        n2 = Math.floor(Math.random() * 20) + 1;
        if (op === '-' && n1 < n2) [n1, n2] = [n2, n1]; // Evitar negativos no easy
        expr = `${n1} ${op} ${n2}`;
    } else if (difficulty === 'medium') {
        // Soma/Sub (10-100)
        op = Math.random() < 0.5 ? '+' : '-';
        n1 = Math.floor(Math.random() * 90) + 10;
        n2 = Math.floor(Math.random() * 90) + 10;
        if (op === '-' && n1 < n2) [n1, n2] = [n2, n1];
        expr = `${n1} ${op} ${n2}`;
    } else {
        // Multiplicação e Soma complexa
        op = operators[Math.floor(Math.random() * operators.length)];
        if (op === '*') {
            n1 = Math.floor(Math.random() * 12) + 2;
            n2 = Math.floor(Math.random() * 12) + 2;
        } else {
            n1 = Math.floor(Math.random() * 500) + 50;
            n2 = Math.floor(Math.random() * 500) + 50;
        }
        if (op === '-' && n1 < n2) [n1, n2] = [n2, n1];
        expr = `${n1} ${op} ${n2}`;
    }

    // Calcular resultado real
    const result = Math.floor(eval(expr)); // Seguro pois inputs são gerados internamente
    return { question: expr, answer: result.toString() };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('race')
        .setDescription('Inicie uma corrida de digitação multiplayer!')
        .addStringOption(option =>
            option.setName('modo')
                .setDescription('Escolha o modo de jogo')
                .setRequired(true)
                .addChoices(
                    { name: '📝 Palavras', value: 'words' },
                    { name: '🔢 Números', value: 'numbers' },
                    { name: '➗ Matemática', value: 'math' },
                    { name: '💬 Frases', value: 'sentences' }
                ))
        .addStringOption(option =>
            option.setName('dificuldade')
                .setDescription('Nível de desafio')
                .setRequired(true)
                .addChoices(
                    { name: '🟢 Fácil', value: 'easy' },
                    { name: '🟡 Médio', value: 'medium' },
                    { name: '🔴 Difícil', value: 'hard' },
                ))
        .addIntegerOption(option =>
            option.setName('rodadas')
                .setDescription('Número de rodadas (Padrão: 10)')
                .setMinValue(1)
                .setMaxValue(50)),
    async execute(interaction) {
        const host = interaction.user;
        const mode = interaction.options.getString('modo');
        const difficulty = interaction.options.getString('dificuldade');
        const rounds = interaction.options.getInteger('rodadas') || 10;

        if (activeGames.has(interaction.channelId)) {
            return interaction.reply({ content: 'Já existe uma corrida acontecendo neste canal!', ephemeral: true });
        }

        const gameId = interaction.channelId;
        const players = new Set([host.id]);

        const lobbyEmbed = new EmbedBuilder()
            .setTitle('🏎️ Corrida de Digitação - Lobby')
            .setDescription(`**Host:** ${host}\n**Modo:** ${mode.toUpperCase()}\n**Dificuldade:** ${difficulty.toUpperCase()}\n**Rodadas:** ${rounds}\n\n**Participantes (1):**\n${formatPlayerList(players)}`)
            .setColor('#0099ff')
            .setFooter({ text: 'Clique em "Participar" para entrar!' });

        const joinButton = new ButtonBuilder()
            .setCustomId('join_race').setLabel('Participar').setStyle(ButtonStyle.Primary);
        const leaveButton = new ButtonBuilder()
            .setCustomId('leave_race').setLabel('Sair').setStyle(ButtonStyle.Secondary);
        const startButton = new ButtonBuilder()
            .setCustomId('start_race').setLabel('Iniciar Corrida').setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(joinButton, leaveButton, startButton);

        const response = await interaction.reply({
            embeds: [lobbyEmbed],
            components: [row]
        });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        activeGames.set(gameId, {
            status: 'lobby',
            host: host.id,
            players: players,
            scores: {},
            mode: mode,
            difficulty: difficulty,
            rounds: rounds,
            currentRound: 0,
            channel: interaction.channel,
            message: response
        });

        collector.on('collect', async i => {
            const game = activeGames.get(gameId);
            if (!game || game.status !== 'lobby') return;

            if (i.customId === 'join_race') {
                if (game.players.has(i.user.id)) return i.reply({ content: 'Já está no lobby!', ephemeral: true });
                game.players.add(i.user.id);
                updateLobby(i, game);
            } else if (i.customId === 'leave_race') {
                if (i.user.id === game.host) return i.reply({ content: 'Host não pode sair!', ephemeral: true });
                if (!game.players.has(i.user.id)) return i.reply({ content: 'Não está no lobby!', ephemeral: true });
                game.players.delete(i.user.id);
                updateLobby(i, game);
            } else if (i.customId === 'start_race') {
                if (i.user.id !== game.host) return i.reply({ content: 'Apenas host inicia!', ephemeral: true });

                await i.update({ content: '🚀 **A corrida vai começar!**', components: [] });
                collector.stop('started');
                game.status = 'ingame';
                // Inicializa scores como OBJETO
                game.players.forEach(pid => game.scores[pid] = { points: 0, maxWPM: 0 });
                startRound(gameId);
            }
        });

        collector.on('end', (collected, reason) => {
            const game = activeGames.get(gameId);
            if (reason !== 'started' && game && game.status === 'lobby') {
                activeGames.delete(gameId);
                game.message.edit({ content: '⏳ Lobby expirou.', components: [] });
            }
        });
    },
};

function formatPlayerList(playerSet) {
    return Array.from(playerSet).map(id => `- <@${id}>`).join('\n');
}

async function updateLobby(interaction, game) {
    const embed = new EmbedBuilder()
        .setTitle('🏎️ Corrida de Digitação - Lobby')
        .setDescription(`**Host:** <@${game.host}>\n**Modo:** ${game.mode.toUpperCase()}\n**Dificuldade:** ${game.difficulty.toUpperCase()}\n**Rodadas:** ${game.rounds}\n\n**Participantes (${game.players.size}):**\n${formatPlayerList(game.players)}`)
        .setColor('#0099ff')
        .setFooter({ text: 'Clique em "Participar" para entrar!' });

    await interaction.update({ embeds: [embed] });
}

async function startRound(channelId) {
    const game = activeGames.get(channelId);
    if (!game) return;

    game.currentRound++;
    if (game.currentRound > game.rounds) {
        finishGame(channelId);
        return;
    }

    let questionOriginal, questionDisplay, expectedAnswer;

    // GERAR CONTEÚDO BASEADO NO MODO
    if (game.mode === 'words') {
        let words;
        if (game.difficulty === 'easy') words = wordsData.facil;
        else if (game.difficulty === 'medium') words = wordsData.medio;
        else words = wordsData.dificil; // hard

        questionOriginal = words[Math.floor(Math.random() * words.length)];
        questionDisplay = getAntiCheatWord(questionOriginal);
        expectedAnswer = questionOriginal;

    } else if (game.mode === 'numbers') {
        const len = game.difficulty === 'easy' ? 6 : (game.difficulty === 'medium' ? 12 : 24);
        questionOriginal = generateNumber(len);
        questionDisplay = getAntiCheatWord(questionOriginal);
        expectedAnswer = questionOriginal;

    } else if (game.mode === 'math') {
        const problem = generateMath(game.difficulty);
        questionOriginal = problem.question;
        questionDisplay = problem.question;
        expectedAnswer = problem.answer;

    } else if (game.mode === 'sentences') {
        let phrases;
        // words.json agora tem a chave 'frases'
        if (wordsData.frases) {
            if (game.difficulty === 'easy') phrases = wordsData.frases.facil;
            else if (game.difficulty === 'medium') phrases = wordsData.frases.medio;
            else phrases = wordsData.frases.dificil; // hard
        } else {
            // Fallback se não tiver frases carregadas
            phrases = ["Erro: Frases não carregadas. Avise o admin."];
        }

        questionOriginal = phrases[Math.floor(Math.random() * phrases.length)];
        questionDisplay = getAntiCheatWord(questionOriginal);
        expectedAnswer = questionOriginal;
    }

    const channel = game.channel;
    await channel.send(`🔹 Rodada **${game.currentRound}/${game.rounds}**! Preparar...`);

    setTimeout(async () => {
        if (game.mode === 'math') {
            await channel.send(`🧮 **RESOLVA:**`);
            await channel.send(`## ${questionDisplay}`);
        } else {
            await channel.send(`🏁 **DIGITE:**`);
            await channel.send(`## ${questionDisplay}`);
        }

        const roundStartTime = Date.now();
        let roundWon = false;
        const filter = m => game.players.has(m.author.id);
        const collector = channel.createMessageCollector({ filter, time: 25000 });

        collector.on('collect', async m => {
            if (roundWon) return;

            if (m.content === expectedAnswer) {
                roundWon = true;
                const timeTaken = (Date.now() - roundStartTime) / 1000;

                // Calcular WPM (Palavras por Minuto)
                const chars = expectedAnswer.length;
                const minutes = timeTaken / 60;
                const wpm = minutes > 0 ? Math.round((chars / 5) / minutes) : 0;

                game.scores[m.author.id].points++;
                if (wpm > game.scores[m.author.id].maxWPM) {
                    game.scores[m.author.id].maxWPM = wpm;
                }

                const winEmbed = new EmbedBuilder()
                    .setDescription(`✅ **${m.author}** acertou! (+1 ponto)\nResposta: **${expectedAnswer}**\n⏱️ Tempo: ${timeTaken.toFixed(2)}s | ⚡ **${wpm} WPM**`)
                    .setColor('#00FF00');

                await channel.send({ embeds: [winEmbed] });
                collector.stop('winner');
            } else if (game.mode !== 'math' && m.content === questionDisplay) {
                m.reply('🚫 **Anti-Cheat:** Copiar e colar é proibido!').then(msg => setTimeout(() => msg.delete(), 3000));
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'winner') {
                channel.send(`⏳ Tempo esgotado! A resposta era: **${expectedAnswer}**`);
            }
            setTimeout(() => startRound(channelId), 3000);
        });
    }, 2000);
}

async function finishGame(channelId) {
    const game = activeGames.get(channelId);
    if (!game) return;

    // Carregar stats
    const statsPath = path.join(__dirname, '../data/stats.json');
    let stats = {};
    try {
        stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    } catch (err) {
        console.error('Erro ao ler stats:', err);
        stats = { global: {}, modes: { words: {}, numbers: {}, math: {}, sentences: {} } };
    }

    // Inicializar modos se não existirem
    if (!stats.modes[game.mode]) stats.modes[game.mode] = {};

    // Ordenar scores para determinar vencedor (pelo total de pontos)
    const sortedScores = Object.entries(game.scores)
        .sort(([, statsA], [, statsB]) => statsB.points - statsA.points);

    let rankText = '';
    const medals = ['🥇', '🥈', '🥉'];

    // Processar resultados
    sortedScores.forEach(([userId, playerStats], index) => {
        const medal = medals[index] || `#${index + 1}`;
        // Garantir que temos acesso seguro às propriedades
        const points = playerStats?.points || 0;
        const maxWPM = playerStats?.maxWPM || 0;

        rankText += `${medal} <@${userId}>: **${points}** pts (Melhor: ${maxWPM} WPM)\n`;

        // Atualizar Stats Globais
        if (!stats.global[userId]) stats.global[userId] = { wins: 0, games: 0, points: 0, maxWPM: 0 };

        stats.global[userId].games++;
        stats.global[userId].points += points;

        const currentGlobalMax = stats.global[userId].maxWPM || 0;
        if (maxWPM > currentGlobalMax) {
            stats.global[userId].maxWPM = maxWPM;
        }

        if (index === 0 && points > 0) stats.global[userId].wins++;

        // Atualizar Stats do Modo
        if (!stats.modes[game.mode][userId]) stats.modes[game.mode][userId] = { wins: 0, games: 0, points: 0, maxWPM: 0 };

        stats.modes[game.mode][userId].games++;
        stats.modes[game.mode][userId].points += points;

        const currentModeMax = stats.modes[game.mode][userId].maxWPM || 0;
        if (maxWPM > currentModeMax) {
            stats.modes[game.mode][userId].maxWPM = maxWPM;
        }

        if (index === 0 && points > 0) stats.modes[game.mode][userId].wins++;
    });

    // Salvar stats
    try {
        fs.writeFileSync(statsPath, JSON.stringify(stats, null, 4));
    } catch (err) {
        console.error('Erro ao salvar stats:', err);
    }

    const embed = new EmbedBuilder()
        .setTitle('🏆 Fim do Jogo! Resultados')
        .setDescription(rankText || 'Ninguém pontuou 😢')
        .setColor('#FFD700');

    game.channel.send({ embeds: [embed] });
    activeGames.delete(channelId);
}
