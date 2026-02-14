const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[AVISO] O comando em ${path.join(commandsPath, file)} está faltando a propriedade "data" ou "execute".`);
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Iniciando atualização de ${commands.length} comandos (/) da aplicação.`);

        // O método put é usado para atualizar todos os comandos da guilda com o conjunto atual
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Comandos (/) recarregados com sucesso. Total: ${data.length}.`);
    } catch (error) {
        console.error(error);
    }
})();
