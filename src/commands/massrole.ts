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
  name: 'massrole',
  description: 'Masowo nadaje lub zabiera rolę wszystkim użytkownikom na serwerze',
  options: [
    {
      name: 'add',
      description: 'Nadaje rolę wszystkim użytkownikom',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'role',
          description: 'Rola do nadania',
          type: ApplicationCommandOptionType.Role,
          required: true,
        },
      ],
    },
    {
      name: 'remove',
      description: 'Zabiera rolę wszystkim użytkownikom',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'role',
          description: 'Rola do zabrania',
          type: ApplicationCommandOptionType.Role,
          required: true,
        },
      ],
    },
  ],
  enabled: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.reply({
        content: 'Nie masz uprawnień do używania tej komendy (wymagane: Zarządzanie rolami).',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const roleOption = interaction.options.getRole('role', true);
    const { guild, user: admin } = interaction;

    if (!guild) return;

    const role = guild.roles.cache.get(roleOption.id);
    if (!role) {
      await interaction.reply({
        content: 'Nie mogę znaleźć tej roli na serwerze.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const botMember = guild.members.me;
    if (!botMember || !role.editable) {
      await interaction.reply({
        content: 'Nie mogę zarządzać tą rolą (za wysokie uprawnienia).',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const adminMember = guild.members.cache.get(admin.id);
    if (!adminMember || role.position >= adminMember.roles.highest.position) {
      await interaction.reply({
        content: 'Nie możesz zarządzać tą rolą (za wysokie uprawnienia).',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    await guild.members.fetch();
    const members = guild.members.cache.filter((member) => !member.user.bot);

    let successCount = 0;

    const operation = subcommand === 'add' ? 'nadawania' : 'zabierania';
    const actionText = subcommand === 'add' ? 'nadano' : 'zabrano';

    for (let i = 0; i < members.size; i += 50) {
      const batch = Array.from(members.values()).slice(i, i + 50);

      await Promise.allSettled(
        batch.map(async (member) => {
          if (subcommand === 'add') {
            if (!member.roles.cache.has(role.id)) {
              await member.roles.add(role);
              successCount++;
            }
          } else {
            if (member.roles.cache.has(role.id)) {
              await member.roles.remove(role);
              successCount++;
            }
          }
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const embed = new EmbedBuilder()
      .setTitle(`Zakończono masowe ${operation} roli!`)
      .setDescription(
        [
          `• Rola: ${role}`,
          `• Operacja: ${actionText}`,
          '',
          `✅ Pomyślnie nadano rolę **${successCount}** użytkownikom.`,
        ].join('\n'),
      )
      .setColor(0x10b981)
      .setTimestamp()
      .setFooter({
        text: `Wykonano przez ${admin.tag}`,
        iconURL: admin.displayAvatarURL(),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
