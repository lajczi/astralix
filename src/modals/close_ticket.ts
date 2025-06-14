/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChannelType, EmbedBuilder, type GuildChannel, MessageFlags, type ModalSubmitInteraction } from 'discord.js';
import type { Bot } from '../classes/Bot.js';
import { extractTicketIdFromChannel, extractUserIdFromChannel } from '../utils/ticketUtils.js';

export async function run(_client: Bot, interaction: ModalSubmitInteraction) {
    const reason = interaction.fields.getTextInputValue('close_reason');
    const channel = interaction.channel;
    const { guild } = interaction;

    if (!channel || channel.type !== ChannelType.GuildText || !('name' in channel) || !channel.name.includes('🎫')) {
        await interaction.reply({
            content: 'Ten kanał nie jest kanałem zgłoszenia.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const userId = extractUserIdFromChannel(channel as GuildChannel);
    const ticketId = extractTicketIdFromChannel(channel as GuildChannel);

    if (!userId || !guild) {
        await interaction.reply({
            content: 'Nie mogę znaleźć użytkownika tego zgłoszenia.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const targetUser = await guild.members.fetch(userId).catch(() => null);
    if (targetUser) {
        const dmEmbed = new EmbedBuilder()
            .setTitle('🔒 Zgłoszenie zamknięte')
            .setDescription(
                [
                    `Twoje zgłoszenie na serwerze **${guild.name}** zostało zamknięte.`,
                    '',
                    `• ID: \`${ticketId}\``,
                    `• Powód: \`${reason}\``,
                    `• Administrator: ${interaction.user}`,
                    `• Data: <t:${Math.floor(Date.now() / 1000)}:F>`,
                ].join('\n'),
            )
            .setColor(0xff4757)
            .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
    }

    await interaction.reply('Zgłoszenie zostanie zamknięte...');
    await channel.delete().catch(() => {});
}
