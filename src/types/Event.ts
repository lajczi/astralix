/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ClientEvents } from 'discord.js';
import type { Client } from '../structures/Client.js';

export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute: (client: Client, ...args: ClientEvents[K]) => Promise<void> | void;
}
