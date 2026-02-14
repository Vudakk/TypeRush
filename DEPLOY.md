# 🚀 Como colocar o TypeRush Online

Parabéns! O bot está pronto. Aqui está o guia para compartilhar e hospedar.

## 1. Segurança Primeiro! 🔒
Antes de mais nada:
*   **JAMAIS compartilhe seu arquivo `.env`** ou seu Token.
*   Se for subir o código no GitHub, o arquivo `.env` já está no `.gitignore` (eu verifiquei), então está seguro.
*   O token é a senha do seu bot. Se vazar, clique em "Reset Token" no Discord Developer Portal.

## 2. Hospedagem (Onde deixar online 24/7) ☁️

Para o bot não desligar quando você desliga o PC, você precisa de um "Host".

### Opção A: Square Cloud (Recomendada 🇧🇷)
Empresa brasileira, muito usada para bots de Discord. Tem plano gratuito e barato.
1.  Crie conta em [squarecloud.app](https://squarecloud.app/).
2.  No painel, clique em "Add Application".
3.  Crie um arquivo chamado `squarecloud.config` na pasta do bot com isso:
    ```ini
    DISPLAY_NAME=TypeRush
    DESCRIPTION=Bot de corrida de digitação
    MAIN=src/index.js
    MEMORY=256
    VERSION=recommended
    ```
4.  Compacte todos os arquivos (exceto `node_modules` e paradas pesadas) em um `.zip`.
5.  Faça o upload no site.
6.  O `.env` deve ser configurado na aba "Configuration" ou "Variables" do site.

### Opção B: Discloud (Também 🇧🇷)
Bem popular e focada em bots.
1.  [discloudbot.com](https://discloudbot.com/).
2.  Crie um arquivo `discloud.config`:
    ```ini
    NAME=TypeRush
    AVATAR=https://i.imgur.com/seulogo.png
    TYPE=bot
    MAIN=src/index.js
    RAM=100
    AUTORESTART=false
    VERSION=latest
    APT=tools
    ```
3.  Zipa e upa.

### Opção C: Render / Railway
Serviços internacionais robustos, mas podem ser mais complexos de configurar e o free tier do Render desliga se não usar.

## 3. Tornando Público (Opcional) 📢
*   Se quiser que **qualquer um** adicione seu bot, vá no [Developer Portal](https://discord.com/developers/applications) > **Installation** e marque **User Install** ou deixe gerenciar o link de convite.
*   Se o bot passar de **100 servidores**, o Discord vai pedir verificação (identidade).

## 4. Dica de Ouro ✨
Crie um servidor de "Suporte" no Discord para o seu bot. As pessoas vão achar bugs e você precisa de um lugar para elas reportarem!
