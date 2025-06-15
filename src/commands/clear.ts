/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
    type ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js';
import type { Bot } from '../classes/Bot.js';

export async function run(_client: Bot, interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('amount', true);
    const { channel, user } = interaction;

    if (!channel?.isTextBased() || !('bulkDelete' in channel)) {
        await interaction.reply({
            content: 'Ta komenda może być użyta tylko w kanałach tekstowych.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const messages = await channel.messages.fetch({ limit: amount });
    const deleted = await channel.bulkDelete(messages, true);

    const embed = new EmbedBuilder()
        .setTitle('🗑️ Wyczyszczono kanał')
        .setDescription(`Usunięto **${deleted.size}** wiadomości.`)
        .setColor(0x10b981)
        .setTimestamp()
        .setFooter({
            text: `Wykonano przez ${user.tag}`,
            iconURL: user.displayAvatarURL(),
        });

    await interaction.editReply({ embeds: [embed] });
}

export const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Usuwa określoną liczbę wiadomości z kanału')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((option) =>
        option
            .setName('amount')
            .setDescription('Liczba wiadomości do usunięcia (1-100)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100),
    );
