/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { type Interaction, InteractionType, MessageFlags } from 'discord.js';
import type { Bot } from '../classes/Bot.js';
import { logger } from '../utils/logger.js';

export async function interactionCreate(client: Bot, interaction: Interaction) {
    try {
        switch (interaction.type) {
            case InteractionType.ApplicationCommand:
                if (!interaction.isChatInputCommand()) return;
                await handleCommand(client, interaction);
                break;
            case InteractionType.MessageComponent:
                await handleComponent(client, interaction);
                break;
            case InteractionType.ModalSubmit:
                await handleModal(client, interaction);
                break;
            case InteractionType.ApplicationCommandAutocomplete:
                if (!interaction.isAutocomplete()) return;
                await handleAutocomplete(client, interaction);
                break;
        }
    } catch (err) {
        logger.error(`Interaction error: ${err}`);
        await sendErrorResponse(interaction, 'Wystąpił błąd podczas wykonywania komendy.');
    }
}

async function handleCommand(client: Bot, interaction: any) {
    const subcommand = interaction.options.getSubcommand(false);
    const commandName = subcommand ? `${interaction.commandName}/${subcommand}` : interaction.commandName;
    const command = client.commands.get(commandName);

    await command?.run(client, interaction);
}

async function handleComponent(client: Bot, interaction: any) {
    const [id] = interaction.customId.split('.');
    const component = client.components.get(id);

    await component?.run(client, interaction);
}

async function handleModal(client: Bot, interaction: any) {
    const [modalId] = interaction.customId.split('.');
    const modal = client.modals.get(modalId);

    await modal?.run(client, interaction);
}

async function handleAutocomplete(client: Bot, interaction: any) {
    const subcommandName = interaction.options.getSubcommand(false);
    const commandName = subcommandName ? `${interaction.commandName}/${subcommandName}` : interaction.commandName;
    const command = client.commands.get(commandName);

    await command?.autocomplete?.(client, interaction);
}

async function sendErrorResponse(interaction: any, message: string) {
    const response = { content: message, flags: MessageFlags.Ephemeral };

    if (interaction.deferred || interaction.replied) {
        await interaction.followUp(response);
    } else {
        await interaction.reply(response);
    }
}
