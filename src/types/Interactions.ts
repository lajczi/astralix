/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type {
    ChatInputCommandInteraction,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    SlashCommandBuilder,
} from 'discord.js';
import type { Bot } from '../classes/Bot.js';

export interface Interaction<T> {
    run(client: Bot, arg: T): void;
}

export interface Command extends Interaction<ChatInputCommandInteraction> {
    autocomplete?(client: Bot, interaction: ChatInputCommandInteraction): void;
    data: SlashCommandBuilder;
}

export interface MessageComponent extends Interaction<MessageComponentInteraction> {}

export interface Modal extends Interaction<ModalSubmitInteraction> {}
