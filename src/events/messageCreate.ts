/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { EmbedBuilder, type Message, PermissionsBitField } from 'discord.js';
import type { Bot } from '../classes/Bot.js';
import { config } from '../config.js';

export async function messageCreate(_client: Bot, message: Message) {
    if (!message.guild || message.author.bot) return;

    if (message.guild.id === config.guildId) {
        if (shouldModerate(message)) {
            await message.delete();
            return;
        }

        if (message.channel.id === config.suggestions.channelId) {
            await handleSuggestion(message);
        }
    }
}

const SPAM_PATTERNS = [
    /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9]+/i,
    /(?:https?:\/\/)?(?:www\.)?(bit\.ly|tinyurl\.com|t\.co|goo\.gl|short\.link|rebrand\.ly)/i,
    /https?:\/\/[^\s]+\.(?:tk|ml|ga)\b/i,
];

const ALLOWED_DOMAINS = ['cdn.discordapp.com', 'media.discordapp.net', 'discord.com', 'discordapp.com'];

function shouldModerate(message: Message): boolean {
    if (message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return false;
    }

    const content = message.content.toLowerCase();

    if (SPAM_PATTERNS.some((pattern) => pattern.test(content))) {
        return true;
    }

    const urls = content.match(/https?:\/\/[^\s]+/gi);
    return urls?.some((url) => !ALLOWED_DOMAINS.some((domain) => url.includes(domain))) ?? false;
}

async function handleSuggestion(message: Message): Promise<void> {
    if (!message.channel.isTextBased() || !('send' in message.channel)) return;

    const embed = new EmbedBuilder()
        .setTitle('💡 Nowa propozycja')
        .setDescription(`> ${message.content}`)
        .setColor(0x00ff88)
        .setTimestamp()
        .setAuthor({
            name: `${message.author.username} • ${message.author.id}`,
            iconURL: message.author.displayAvatarURL(),
        })
        .setFooter({
            text: message.guild?.name ?? '',
            iconURL: message.guild?.iconURL() ?? '',
        });

    const suggestionMessage = await message.channel.send({ embeds: [embed] });

    await Promise.all([
        suggestionMessage.react('👍'),
        suggestionMessage.react('👎'),
        message.delete(),
        suggestionMessage
            .startThread({
                name: 'Dyskusja o propozycji',
                autoArchiveDuration: 1440,
            })
            .then((thread) => thread.send('W tym wątku możesz przedyskutować tę propozycję.')),
    ]);
}
