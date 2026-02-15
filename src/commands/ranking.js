const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('Veja os melhores jogadores!')
        .addStringOption(option =>
            option.setName('modo')
                .setDescription('Filtrar por modo de jogo (opcional)')
                .addChoices(
                    { name: '🌍 Geral', value: 'global' },
                    { name: '📝 Palavras', value: 'words' },
                    { name: '🔢 Números', value: 'numbers' },
                    { name: '➗ Matemática', value: 'math' },
                    { name: '💬 Frases', value: 'sentences' }
                ))
        .addStringOption(option =>
            option.setName('ordenar')
                .setDescription('Critério de classificação')
                .addChoices(
                    { name: '🏆 Vitórias (Padrão)', value: 'wins' },
                    { name: '⚡ Velocidade (WPM)', value: 'wpm' }
                )),
    async execute(interaction) {
        const mode = interaction.options.getString('modo') || 'global';
        const sortCriteria = interaction.options.getString('ordenar') || 'wins';
        const statsPath = path.join(__dirname, '../data/stats.json');

        let statsData;
        try {
            statsData = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
        } catch (err) {
            return interaction.reply({ content: 'Ainda não há dados de ranking!', ephemeral: true });
        }

        let targetStats;
        let titleSuffix;

        if (mode === 'global') {
            targetStats = statsData.global;
            titleSuffix = 'Global';
        } else {
            targetStats = statsData.modes[mode] || {};
            const keys = { words: 'Palavras', numbers: 'Números', math: 'Matemática', sentences: 'Frases' };
            titleSuffix = keys[mode] || mode;
        }

        if (!targetStats || Object.keys(targetStats).length === 0) {
            return interaction.reply({ content: `Ninguém jogou o modo **${titleSuffix}** ainda. Seja o primeiro!`, ephemeral: true });
        }

        // Ordenar
        const sorted = Object.entries(targetStats)
            .sort(([, a], [, b]) => {
                if (sortCriteria === 'wpm') {
                    return (b.maxWPM || 0) - (a.maxWPM || 0);
                } else {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    return b.points - a.points;
                }
            })
            .slice(0, 10); // Top 10

        let description = '';
        const medals = ['🥇', '🥈', '🥉'];

        sorted.forEach(([userId, stats], index) => {
            const medal = medals[index] || `**${index + 1}.**`;
            const wpmDisplay = stats.maxWPM ? `⚡ ${stats.maxWPM} WPM` : '⚡ -';

            if (sortCriteria === 'wpm') {
                description += `${medal} <@${userId}>\n   ${wpmDisplay} | 🏆 ${stats.wins} wins\n\n`;
            } else {
                description += `${medal} <@${userId}>\n   🏆 ${stats.wins} vitórias | 🎯 ${stats.points} pts | ${wpmDisplay}\n\n`;
            }
        });

        const sortTitle = sortCriteria === 'wpm' ? 'Velocidade Máxima' : 'Maiores Vencedores';
        const embed = new EmbedBuilder()
            .setTitle(`🏆 Ranking TypeRush - ${titleSuffix} (${sortTitle})`)
            .setDescription(description)
            .setColor('#FFD700')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
