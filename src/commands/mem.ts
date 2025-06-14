/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { Bot } from '../classes/Bot.js';

interface MemeResponse {
    url: string;
}

export async function run(client: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const response = await fetch('https://ivall.pl/memy');
    const data = (await response.json()) as MemeResponse;

    const embed = new EmbedBuilder()
        .setTitle('😂 Losowy mem')
        .setImage(data.url)
        .setColor(0x00ff88)
        .setTimestamp()
        .setFooter({
            text: `Dla ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
        });

    await interaction.editReply({ embeds: [embed] });
}

export const data = new SlashCommandBuilder().setName('mem').setDescription('Losowy mem z memy.pl');
