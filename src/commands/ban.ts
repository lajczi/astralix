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
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'Nie podano powodu';
    const { guild, user: admin } = interaction;

    if (!guild) return;

    const member = await guild.members.fetch(targetUser.id).catch(() => {});

    if (!member) {
        await interaction.reply({
            content: 'Użytkownik nie jest na tym serwerze.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (!member.bannable) {
        await interaction.reply({
            content: 'Nie mogę zbanować tego użytkownika (wyższe uprawnienia).',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const dmEmbed = new EmbedBuilder()
        .setTitle('🔨 Zostałeś zbanowany')
        .setDescription(
            [
                `Zostałeś zbanowany z serwera **${guild.name}**`,
                '',
                `• Powód: \`${reason}\``,
                `• Administrator: \`${admin.tag}\``,
                `• Data: <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join('\n'),
        )
        .setColor(0xff4757)
        .setTimestamp();

    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});

    await member.ban({ reason: `${reason} - ${admin.tag}` });

    const successEmbed = new EmbedBuilder()
        .setTitle('🔨 Użytkownik zbanowany')
        .setDescription(
            [
                `**${targetUser.tag}** został pomyślnie zbanowany`,
                '',
                `• Powód: \`${reason}\``,
                `• Administrator: \`${admin.tag}\``,
            ].join('\n'),
        )
        .setColor(0x7c3aed)
        .setTimestamp()
        .setFooter({
            text: `Wykonano przez ${admin.tag}`,
            iconURL: admin.displayAvatarURL(),
        });

    await interaction.reply({ embeds: [successEmbed] });
}

export const data = new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banuje użytkownika z serwera')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) => option.setName('user').setDescription('Użytkownik do zbanowania').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Powód bana').setRequired(false));
