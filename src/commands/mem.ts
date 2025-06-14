/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { type ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import type { Command } from '../types/Command.js';

interface MemeResponse {
  url: string;
}

const command: Command = {
  name: 'mem',
  description: 'Losowy mem z memy.pl',
  enabled: true,
  deferReply: true,
  cooldown: 5,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const response = await fetch('https://ivall.pl/memy');
    const data: MemeResponse = await response.json();

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
  },
};

export default command;
