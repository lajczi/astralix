/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { type Interaction, InteractionType, MessageFlags } from 'discord.js';
import type { Bot } from '../classes/Bot.js';
import type { Command } from '../types/Interactions.js';
import { logger } from '../utils/logger.js';

export async function interactionCreate(client: Bot, interaction: Interaction) {
    switch (interaction?.type) {
        case InteractionType.ApplicationCommand:
            if (!interaction.isChatInputCommand()) return;
            const subcommand = interaction.options.getSubcommand(false);
            let command: Command | undefined;
            if (subcommand) {
                command = client.commands.get(`${interaction.commandName}/${subcommand}`);
            } else {
                command = client.commands.get(interaction.commandName);
            }
            try {
                await command?.run(client, interaction);
            } catch (err) {
                logger.error(`Command error: ${err}`);
                if (interaction.deferred || interaction.replied) {
                    await interaction
                        .followUp({ content: 'An error occurred.', flags: MessageFlags.Ephemeral })
                        .catch(() => {});
                } else {
                    await interaction
                        .reply({ content: 'An error occurred.', flags: MessageFlags.Ephemeral })
                        .catch(() => {});
                }
            }
            break;
        case InteractionType.MessageComponent:
            const [id] = interaction.customId.split('.');
            const component = client.components.get(id);
            try {
                await component?.run(client, interaction);
            } catch (err) {
                logger.error(`Component error: ${err}`);
                if (interaction.deferred || interaction.replied) {
                    await interaction
                        .followUp({ content: 'An error occurred.', flags: MessageFlags.Ephemeral })
                        .catch(() => {});
                } else {
                    await interaction
                        .reply({ content: 'An error occurred.', flags: MessageFlags.Ephemeral })
                        .catch(() => {});
                }
            }
            break;
        case InteractionType.ModalSubmit:
            const [modalId] = interaction.customId.split('.');
            const modal = client.modals.get(modalId);
            try {
                await modal?.run(client, interaction);
            } catch (err) {
                logger.error(`Modal error: ${err}`);
                if (interaction.deferred || interaction.replied) {
                    await interaction
                        .followUp({ content: 'An error occurred.', flags: MessageFlags.Ephemeral })
                        .catch(() => {});
                } else {
                    await interaction
                        .reply({ content: 'An error occurred.', flags: MessageFlags.Ephemeral })
                        .catch(() => {});
                }
            }
            break;
        case InteractionType.ApplicationCommandAutocomplete:
            if (!interaction.isAutocomplete()) return;
            let autocomplete: ((client: Bot, interaction: any) => void) | undefined;
            if (interaction.options.getSubcommand(false)) {
                autocomplete = client.commands.get(
                    `${interaction.commandName}/${interaction.options.getSubcommand(false)}`,
                )?.autocomplete;
            } else {
                autocomplete = client.commands.get(interaction.commandName)?.autocomplete;
            }
            try {
                await autocomplete?.(client, interaction);
            } catch (err) {
                logger.error(`Autocomplete error: ${err}`);
            }
            break;
    }
}
