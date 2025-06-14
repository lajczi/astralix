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

export async function run(client: Bot, interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply({
            content: 'Nie masz uprawnień do używania tej komendy (wymagane: Zarządzanie wiadomościami).',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const amount = interaction.options.getInteger('amount', true);
    const { channel, user: admin } = interaction;

    if (!channel?.isTextBased() || !('bulkDelete' in channel)) {
        await interaction.reply({
            content: 'Ta komenda może być użyta tylko w kanałach tekstowych.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const messages = await channel.messages.fetch({ limit: amount });
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const recentMessages = messages.filter((msg) => msg.createdTimestamp > twoWeeksAgo);
    const oldMessages = messages.filter((msg) => msg.createdTimestamp <= twoWeeksAgo);

    let deletedCount = 0;

    if (recentMessages.size > 0) {
        const bulkDeleted = await channel.bulkDelete(recentMessages, true);
        deletedCount += bulkDeleted.size;
    }

    if (oldMessages.size > 0) {
        for (const message of oldMessages.values()) {
            await message.delete().catch(() => {});
            deletedCount++;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('🗑️ Wyczyszczono kanał')
        .setDescription(`Usunięto **${deletedCount}** wiadomości.`)
        .setColor(0x10b981)
        .setTimestamp()
        .setFooter({
            text: `Wykonano przez ${admin.tag}`,
            iconURL: admin.displayAvatarURL(),
        });

    await interaction.editReply({ embeds: [embed] });
}

export const data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Usuwa określoną liczbę wiadomości z kanału.')
    .addIntegerOption((option) =>
        option
            .setName('amount')
            .setDescription('Liczba wiadomości do usunięcia (1-100).')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100),
    );
