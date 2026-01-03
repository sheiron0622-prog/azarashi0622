const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const DATA_FILE = './battle_stats.json';

// データ読み書き用
function loadData() {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    return { total: { win: 0, lose: 0, draw: 0 }, history: [], last_record: null };
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // ボタンが押されたとき
        if (interaction.isButton()) {
            if (interaction.customId === 'record_btn') {
                const modal = new ModalBuilder().setCustomId('record_modal').setTitle('戦績の入力');
                const winInput = new TextInputBuilder().setCustomId('win').setLabel("勝ち").setStyle(TextInputStyle.Short).setValue("0");
                const loseInput = new TextInputBuilder().setCustomId('lose').setLabel("負け").setStyle(TextInputStyle.Short).setValue("0");
                const drawInput = new TextInputBuilder().setCustomId('draw').setLabel("分け").setStyle(TextInputStyle.Short).setValue("0");

                modal.addComponents(
                    new ActionRowBuilder().addComponents(winInput),
                    new ActionRowBuilder().addComponents(loseInput),
                    new ActionRowBuilder().addComponents(drawInput)
                );
                await interaction.showModal(modal);
            }

            if (interaction.customId === 'stats_btn') {
                const data = loadData();
                const t = data.total;
                const total = t.win + t.lose + t.draw;
                const rate = total > 0 ? (t.win / total * 100).toFixed(1) : "0.0";
                await interaction.reply({ content: `📊 **現在の累計**\n🏆 ${t.win}勝 ${t.lose}敗 ${t.draw}分 (勝率: ${rate}%)` });
            }
        }

        // モーダルが送信されたとき
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'record_modal') {
                const w = parseInt(interaction.fields.getTextInputValue('win')) || 0;
                const l = parseInt(interaction.fields.getTextInputValue('lose')) || 0;
                const d = parseInt(interaction.fields.getTextInputValue('draw')) || 0;

                let data = loadData();
                data.total.win += w; data.total.lose += l; data.total.draw += d;
                data.last_record = { win: w, lose: l, draw: d };
                
                const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
                data.history.push(`${now}: ${w}勝 ${l}敗 ${d}分`);
                fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4));

                await interaction.reply(`✅ 記録完了: ${w}勝 ${l}敗 ${d}分`);
            }
        }
    },
};