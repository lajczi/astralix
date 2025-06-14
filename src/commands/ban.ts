/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
  ApplicationCommandOptionType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import type { Command } from '../types/Command.js';

const command: Command = {
  name: 'ban',
  description: 'Banuje użytkownika z serwera',
  options: [
    {
      name: 'user',
      description: 'Użytkownik do zbanowania',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'reason',
      description: 'Powód bana',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  enabled: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
      await interaction.reply({
        content: 'Nie masz uprawnień do używania tej komendy (wymagane: Banowanie członków).',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'Nie podano powodu';
    const { guild, user: admin } = interaction;

    if (!guild) return;

    const member = await guild.members.fetch(targetUser.id).catch(() => {});

    if (!member) {
      await interaction.reply({
        content: 'Użytkownik nie jest na tym serwerze.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!member.bannable) {
      await interaction.reply({
        content: 'Nie mogę zbanować tego użytkownika (wyższe uprawnienia).',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const dmEmbed = new EmbedBuilder()
      .setTitle('🔨 Zostałeś zbanowany')
      .setDescription(
        [
          `Zostałeś zbanowany z serwera **${guild.name}**`,
          '',
          `• Powód: \`${reason}\``,
          `• Administrator: \`${admin.tag}\``,
          `• Data: <t:${Math.floor(Date.now() / 1000)}:F>`,
        ].join('\n'),
      )
      .setColor(0xff4757)
      .setTimestamp();

    await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});

    await member.ban({ reason: `${reason} - ${admin.tag}` });

    const successEmbed = new EmbedBuilder()
      .setTitle('🔨 Użytkownik zbanowany')
      .setDescription(
        [
          `**${targetUser.tag}** został pomyślnie zbanowany`,
          '',
          `• Powód: \`${reason}\``,
          `• Administrator: \`${admin.tag}\``,
        ].join('\n'),
      )
      .setColor(0x7c3aed)
      .setTimestamp()
      .setFooter({
        text: `Wykonano przez ${admin.tag}`,
        iconURL: admin.displayAvatarURL(),
      });

    await interaction.reply({ embeds: [successEmbed] });
  },
};

export default command;
