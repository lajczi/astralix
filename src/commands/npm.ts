/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import type { Command } from '../types/Command.js';

interface NpmPackage {
  name: string;
  'dist-tags': { latest: string };
  versions: { [version: string]: { description: string } };
  time: { [version: string]: string; created: string; modified: string };
  readme: string;
  homepage?: string;
  repository?: { url: string };
  keywords?: string[];
  description?: string;
}

const command: Command = {
  name: 'npm',
  description: 'Wyświetla informacje o paczce npm',
  options: [
    {
      name: 'package',
      description: 'Nazwa paczki npm',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  enabled: true,
  deferReply: true,
  cooldown: 10,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const packageName = interaction.options.getString('package', true);

    const response = await fetch(`https://registry.npmjs.org/${packageName}`);

    if (!response.ok) {
      await interaction.editReply('Nie znaleziono paczki o podanej nazwie');
      return;
    }

    const pkg: NpmPackage = await response.json();
    const version = pkg['dist-tags']?.latest || 'Nieznana';
    const date = pkg.time?.[version]
      ? new Date(pkg.time[version]).toLocaleDateString('pl-PL')
      : 'Nieznana';
    const description = pkg.description || 'Brak opisu';
    const keywords = pkg.keywords?.slice(0, 3).join(', ') || 'Brak';
    const repository = pkg.repository?.url
      ? pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')
      : 'Brak';

    const embed = new EmbedBuilder()
      .setTitle(`📦 ${pkg.name}`)
      .setDescription(
        [
          `> ${description}`,
          '',
          `• Wersja: \`${version}\``,
          `• Wydano: \`${date}\``,
          `• Tagi: \`${keywords}\``,
          `• Repozytorium: ${repository === 'Brak' ? 'Brak' : `[GitHub](${repository})`}`,
        ].join('\n'),
      )
      .setColor(0x7c3aed)
      .setURL(`https://www.npmjs.com/package/${packageName}`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
