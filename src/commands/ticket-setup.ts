/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import type { Command } from '../types/Command.js';
import { config } from '../utils/config.js';

const command: Command = {
  name: 'ticket-setup',
  description: 'Ustawia system zgłoszeń w kanale',
  enabled: true,
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const { guild } = interaction;

    if (!guild) return;

    const ticketChannel = guild.channels.cache.get(config.tickets.channelId);

    if (!ticketChannel?.isTextBased()) {
      await interaction.reply({
        content: 'Nie mogę znaleźć kanału do zgłoszeń w konfiguracji.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 System zgłoszeń')
      .setDescription(
        [
          '**Potrzebujesz pomocy? Utwórz zgłoszenie!**',
          '',
          'Wybierz odpowiednią kategorię poniżej, aby utworzyć',
          'prywatny kanał do rozmowy z administracją.',
          '',
          '**Dostępne kategorie:**',
          '• 🤝 `Współpraca` - propozycje współpracy i partnerstwa',
          '• 🚨 `Zgłoszenie` - zgłoś użytkownika lub problem na serwerze',
          '• ❓ `Pytanie` - zadaj pytanie administracji',
          '',
          '⚠️ *Możesz mieć tylko jedno aktywne zgłoszenie jednocześnie*',
        ].join('\n'),
      )
      .setColor(0x7c3aed)
      .setTimestamp()
      .setFooter({
        text: guild.name,
        iconURL: guild.iconURL() || undefined,
      });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket_cooperation')
        .setLabel('Współpraca')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🤝'),
      new ButtonBuilder()
        .setCustomId('create_ticket_report')
        .setLabel('Zgłoszenie')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🚨'),
      new ButtonBuilder()
        .setCustomId('create_ticket_question')
        .setLabel('Pytanie')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('❓'),
    );

    await ticketChannel.send({ embeds: [embed], components: [buttons] });

    await interaction.reply({
      content: 'Embed z panelem do ticketów został wysłany na kanał.',
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default command;
