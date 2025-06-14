/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { type ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { Bot } from '../classes/Bot.js';

export async function run(client: Bot, interaction: ChatInputCommandInteraction) {
    const commands = [...client.commands.values()];
    const commandList = commands.map((cmd) => `• \`/${cmd.data.name}\` — ${cmd.data.description}`).join('\n');

    const embed = new EmbedBuilder()
        .setTitle('Komendy bota')
        .setDescription(`Oto wszystkie dostępne komendy:\n\n${commandList}`)
        .setColor(0x7c3aed)
        .setTimestamp()
        .setFooter({
            text: `Wykonano dla ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
        });

    await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
    });
}

export const data = new SlashCommandBuilder().setName('help').setDescription('Wyświetla listę dostępnych komend');
