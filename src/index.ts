/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import process from 'node:process';
import { config } from 'dotenv';

import { Client } from './structures/Client.js';
import { logger } from './utils/logger.js';

config();

if (!process.env.TOKEN || !process.env.APIFLASH_KEY) {
  logger.error('Missing environment variables');
  process.exit(1);
}

const client = new Client();
client.start(process.env.TOKEN);
