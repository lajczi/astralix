/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
    type ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from 'discord.js';
import type { Bot } from '../classes/Bot.js';

export async function run(_client: Bot, interaction: ChatInputCommandInteraction) {
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
}

export const data = new SlashCommandBuilder()
    .setName('massrole')
    .setDescription('Masowo nadaje lub zabiera rolę wszystkim użytkownikom na serwerze')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('add')
            .setDescription('Nadaje rolę wszystkim użytkownikom')
            .addRoleOption((option) => option.setName('role').setDescription('Rola do nadania').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('remove')
            .setDescription('Zabiera rolę wszystkim użytkownikom')
            .addRoleOption((option) => option.setName('role').setDescription('Rola do zabrania').setRequired(true)),
    );
