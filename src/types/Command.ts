/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ApplicationCommandOptionData, ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../structures/Client.js';

export interface Command {
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  enabled?: boolean;
  deferReply?: boolean;
  cooldown?: number;
  ephemeral?: boolean;
  defaultMemberPermissions?: bigint;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
}
