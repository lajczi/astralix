/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MessageFlags, type ModalSubmitInteraction } from 'discord.js';
import type { Bot } from '../classes/Bot.js';
import { createTicket } from '../utils/ticketUtils.js';

export async function run(_client: Bot, interaction: ModalSubmitInteraction) {
    const description = interaction.fields.getTextInputValue('ticket_description');

    const ticketChannel = await createTicket(interaction, 'Współpraca', description);

    if (!ticketChannel) {
        await interaction.reply({
            content: 'Błąd podczas tworzenia zgłoszenia. Spróbuj ponownie.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    await interaction.reply({
        content: `Zgłoszenie zostało utworzone: ${ticketChannel}`,
        flags: MessageFlags.Ephemeral,
    });
}
