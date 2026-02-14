const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Houve um erro ao executar esse comando!', ephemeral: true });
            }
        }
    },
};
