/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Bot } from '../classes/Bot.js';
import { deploy } from '../deploy.js';
import { logger } from '../utils/logger.js';

export async function ready(client: Bot) {
    await deploy(client);
    logger.success(`Logged in as ${client.user?.tag}`);
    logger.info(`Loaded ${client.commands.size} commands`);
    logger.info(`Loaded ${client.events.size} events`);
}
