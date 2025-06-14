/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Buffer } from 'node:buffer';
import process from 'node:process';
import { AttachmentBuilder, type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { Bot } from '../classes/Bot.js';

export async function run(_client: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    let url = interaction.options.getString('url', true);
    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }

    const apiKey = process.env.APIFLASH_KEY ?? '';
    const apiUrl = new URL('https://api.apiflash.com/v1/urltoimage');
    apiUrl.searchParams.set('access_key', apiKey);
    apiUrl.searchParams.set('wait_until', 'page_loaded');
    apiUrl.searchParams.set('url', url);
    apiUrl.searchParams.set('format', 'png');
    apiUrl.searchParams.set('quality', '100');
    apiUrl.searchParams.set('width', '1920');
    apiUrl.searchParams.set('height', '1080');
    apiUrl.searchParams.set('full_page', 'true');
    apiUrl.searchParams.set('fresh', 'true');

    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    const attachment = new AttachmentBuilder(Buffer.from(await response.arrayBuffer()), {
        name: 'screenshot.png',
    });

    const embed = new EmbedBuilder()
        .setTitle('📸 Zrzut ekranu strony WWW')
        .setURL(url)
        .addFields([
            {
                name: 'Strona',
                value: `[${new URL(url).hostname}](${url})`,
                inline: true,
            },
            { name: 'Status', value: 'Pomyślnie wykonano', inline: true },
            {
                name: 'Czas',
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                inline: true,
            },
        ])
        .setImage('attachment://screenshot.png')
        .setColor(0x00ff88)
        .setTimestamp()
        .setFooter({
            text: `Wykonano dla ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL(),
        });

    await interaction.editReply({ embeds: [embed], files: [attachment] });
}

export const data = new SlashCommandBuilder()
    .setName('screenshot')
    .setDescription('Zrób zrzut ekranu strony internetowej')
    .addStringOption((option) =>
        option.setName('url').setDescription('Adres strony do zrzutu ekranu').setRequired(true),
    );
