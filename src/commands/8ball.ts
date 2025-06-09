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

const responses = [
  'Tak, na pewno!',
  'Zdecydowanie tak',
  'Bez wątpienia',
  'Tak - zdecydowanie',
  'Możesz na tym polegać',
  'Z mojego punktu widzenia, tak',
  'Najprawdopodobniej',
  'Perspektywy dobre',
  'Tak',
  'Znaki wskazują na tak',
  'Odpowiedź mglista, spróbuj ponownie',
  'Zapytaj ponownie później',
  'Lepiej ci teraz nie mówić',
  'Nie można teraz przewidzieć',
  'Skoncentruj się i zapytaj ponownie',
  'Nie licz na to',
  'Moja odpowiedź to nie',
  'Moje źródła mówią nie',
  'Perspektywy nie bardzo',
  'Bardzo wątpliwe',
  'Absolutnie!',
  'To pewne jak śmierć',
  'Możesz być tego pewny',
  'Wszystko na to wskazuje',
  'Bez wątpienia tak',
  'Tak, ale bądź ostrożny',
  'Prawdopodobnie tak',
  'To możliwe',
  'Może się zdarzyć',
  'Jest szansa',
  'Nie sądzę',
  'Raczej nie',
  'Nie ma mowy',
  'To niemożliwe',
  'Absolutnie nie',
  'Nie ma szans',
  'Zapomnij o tym',
  'To nie nastąpi',
  'Nawet nie myśl o tym',
  'To mało prawdopodobne',
] as const;

const command: Command = {
  name: '8ball',
  description: 'Zadaj pytanie magicznej kuli',
  options: [
    {
      name: 'question',
      description: 'Twoje pytanie do magicznej kuli',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  enabled: true,
  cooldown: 3,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const question = interaction.options.getString('question', true);
    const response = responses[Math.floor(Math.random() * responses.length)];

    const embed = new EmbedBuilder()
      .setTitle('🎱 Magiczna kula')
      .addFields([
        {
          name: 'Pytanie',
          value: `> ${question}`,
          inline: false,
        },
        {
          name: 'Odpowiedź',
          value: `**${response}**`,
          inline: false,
        },
      ])
      .setColor(0x7c3aed)
      .setTimestamp()
      .setFooter({
        text: `Zapytał: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
