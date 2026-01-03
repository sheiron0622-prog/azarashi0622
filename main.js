const { Client, Collection, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// 1. Clientの定義 (ここを最初に持ってくることで ReferenceError を防ぎます)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

const DATA_FILE = './battle_stats.json';

// データ読み書き用関数
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    return { total: { win: 0, lose: 0, draw: 0 }, history: [], last_record: null };
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4));
}

//-----------commands------------
require("./deploy-commands.js");

//--------------------コマンドを読み込む--------------------------
client.commands = new Collection();
const slashcommandsPath = path.join(__dirname, 'commands');
const slashcommandFiles = fs.readdirSync(slashcommandsPath).filter(file => file.endsWith('.js'));

for (const file of slashcommandFiles) {
    const slashfilePath = path.join(slashcommandsPath, file);
    const command = require(slashfilePath);
    console.log(`-> [Loaded Command] ${file.split('.')[0]}`);
    client.commands.set(command.data.name, command);
}

//イベント読み込み
const eventsPath = path.join(__dirname, 'events');
const eventsFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventsFiles) {
    const eventfilePath = path.join(eventsPath, file);
    const event = require(eventfilePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`-> [Loaded Event] ${file.split('.')[0]}`);
}

//--------------------インタラクション処理--------------------------
client.on(Events.InteractionCreate, async interaction => {
    // スラッシュコマンド
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(client, interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'コマンド実行中にエラーが発生しました', ephemeral: true });
        }
    }

    // 1. 「戦績を記録」ボタンが押された時
    if (interaction.isButton() && interaction.customId === 'record_battle') {
        const modal = new ModalBuilder().setCustomId('battle_modal').setTitle('戦績の入力');
        const winInput = new TextInputBuilder().setCustomId('win').setLabel("勝ち数").setValue("0").setStyle(TextInputStyle.Short);
        const loseInput = new TextInputBuilder().setCustomId('lose').setLabel("負け数").setValue("0").setStyle(TextInputStyle.Short);
        const drawInput = new TextInputBuilder().setCustomId('draw').setLabel("引き分け数").setValue("0").setStyle(TextInputStyle.Short);

        modal.addComponents(
            new ActionRowBuilder().addComponents(winInput),
            new ActionRowBuilder().addComponents(loseInput),
            new ActionRowBuilder().addComponents(drawInput)
        );
        await interaction.showModal(modal);
    }

    // 2. モーダルで数字が送信された時
    if (interaction.isModalSubmit() && interaction.customId === 'battle_modal') {
        let data = loadData();
        const w = parseInt(interaction.fields.getTextInputValue('win')) || 0;
        const l = parseInt(interaction.fields.getTextInputValue('lose')) || 0;
        const d = parseInt(interaction.fields.getTextInputValue('draw')) || 0;

        data.last_record = { win: w, lose: l, draw: d };
        data.total.win += w;
        data.total.lose += l;
        data.total.draw += d;
        data.history.push(`${new Date().toLocaleString('ja-JP')} : ${w}勝 ${l}敗 ${d}分`);

        saveData(data);
        await interaction.reply({ content: `✅ 記録しました: ${w}勝 ${l}敗 ${d}分`, ephemeral: true });
    }

    // 3. 「現在の戦績表示」ボタンが押された時
    if (interaction.isButton() && interaction.customId === 'show_stats') {
        const data = loadData();
        const t = data.total;
        const total = t.win + t.lose + t.draw;
        const rate = total > 0 ? ((t.win / total) * 100).toFixed(1) : 0;
        await interaction.reply({ content: `📊 **現在の累計**\n🏆 ${t.win}勝 ${t.lose}敗 ${t.draw}分 (勝率: ${rate}%)`, ephemeral: true });
    }
});

// ログイン
client.login(process.env.TOKEN);