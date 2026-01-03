const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('戦績管理パネルを表示します'),
    async execute(client, interaction) {
        const embed = new EmbedBuilder()
            .setTitle("🎮 戦績管理パネル")
            .setDescription("ボタンを押して数字を入力してください。")
            .setColor(0x0099FF);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('record_battle')
                .setLabel('戦績を記録')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📝'),
            new ButtonBuilder()
                .setCustomId('show_stats')
                .setLabel('現在の戦績表示')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📊')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};