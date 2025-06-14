/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
    ActionRowBuilder,
    type MessageComponentInteraction,
    MessageFlags,
    ModalBuilder,
    PermissionFlagsBits,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import type { Bot } from '../classes/Bot.js';

export async function run(_client: Bot, interaction: MessageComponentInteraction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.reply({
            content: 'Nie masz uprawnień do zamykania zgłoszeń.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const modal = new ModalBuilder().setCustomId('close_ticket').setTitle('Zamknij zgłoszenie');

    const reasonInput = new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
            .setCustomId('close_reason')
            .setLabel('Powód zamknięcia')
            .setPlaceholder('Podaj powód zamknięcia zgłoszenia')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(500),
    );

    modal.addComponents(reasonInput);
    await interaction.showModal(modal);
}
