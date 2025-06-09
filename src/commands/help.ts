/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { type ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Client } from '../structures/Client.js';
import type { Command } from '../types/Command.js';

const command: Command = {
  name: 'help',
  description: 'Wyświetla listę dostępnych komend',
  enabled: true,
  ephemeral: true,
  execute: async (interaction: ChatInputCommandInteraction, client: Client) => {
    const commands = [...client.commands.values()].filter((cmd) => cmd.enabled !== false);

    const commandList = commands.map((cmd) => `• \`/${cmd.name}\` — ${cmd.description}`).join('\n');

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
  },
};

export default command;
