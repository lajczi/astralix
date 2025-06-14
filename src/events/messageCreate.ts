/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { EmbedBuilder, type Message, PermissionsBitField } from 'discord.js';
import { config } from '../config.js';
import type { Event } from '../types/Event.js';

const event: Event = {
  name: 'messageCreate',
  execute: async (_client, ...args) => {
    const message = args[0] as Message;
    if (!shouldProcessMessage(message)) return;

    if (shouldModerate(message)) {
      await message.delete().catch(() => {});
      return;
    }

    await handleSuggestion(message);
  },
};

export default event;

const DISALLOWED_PATTERNS = [
  {
    pattern:
      /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9]+/i,
  },
  {
    pattern:
      /(?:https?:\/\/)?(?:www\.)?(bit\.ly|tinyurl\.com|t\.co|goo\.gl|short\.link|rebrand\.ly)/i,
  },
  {
    pattern: /https?:\/\/[^\s]+\.(?:tk|ml|ga)\b/i,
  },
];

const ALLOWED_DOMAINS = [
  'cdn.discordapp.com',
  'media.discordapp.net',
  'discord.com',
  'discordapp.com',
];

function shouldProcessMessage(message: Message): boolean {
  return Boolean(message.guild && !message.author.bot);
}

function shouldModerate(message: Message): boolean {
  if (
    message.guild?.id !== config.guildId ||
    message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
    message.author.bot
  ) {
    return false;
  }

  const content = message.content.toLowerCase();

  if (DISALLOWED_PATTERNS.some(({ pattern }) => pattern.test(content))) {
    return true;
  }

  const urls = content.match(/https?:\/\/[^\s]+/gi) ?? [];
  return urls.some((url) => !ALLOWED_DOMAINS.some((domain) => url.includes(domain)));
}

async function handleSuggestion(message: Message): Promise<void> {
  if (
    message.guild?.id !== config.guildId ||
    message.channel.id !== config.suggestions.channelId ||
    message.author.bot ||
    !message.channel.isTextBased()
  ) {
    return;
  }

  if (!('send' in message.channel)) return;

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
      text: message.guild?.name,
      iconURL: message.guild?.iconURL() || undefined,
    });

  const suggestionMessage = await message.channel.send({ embeds: [embed] });
  await Promise.all([
    suggestionMessage.react('👍'),
    suggestionMessage.react('👎'),
    message.delete(),
  ]);

  const thread = await suggestionMessage.startThread({
    name: 'Dyskusja o propozycji',
    autoArchiveDuration: 1440,
  });

  await thread.send('W tym wątku możesz przedyskutować tę propozycję.');
}
