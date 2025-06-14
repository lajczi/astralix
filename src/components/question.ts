/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
    ActionRowBuilder,
    type MessageComponentInteraction,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import type { Bot } from '../classes/Bot.js';
import { hasActiveTicket } from '../utils/ticketUtils.js';

export async function run(_client: Bot, interaction: MessageComponentInteraction) {
    const { guild, user } = interaction;

    if (!guild) return;

    if (await hasActiveTicket(guild, user)) {
        await interaction.reply({
            content: 'Masz już aktywne zgłoszenie. Zamknij je przed utworzeniem nowego.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const modal = new ModalBuilder().setCustomId('question').setTitle('❓ Pytanie do administracji');

    const descriptionInput = new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
            .setCustomId('ticket_description')
            .setLabel('Opis zgłoszenia')
            .setPlaceholder('Opisz szczegółowo swoje pytanie')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000),
    );

    modal.addComponents(descriptionInput);
    await interaction.showModal(modal);
}
