/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readFileSync } from 'node:fs';
import { parse } from 'smol-toml';

export const config = parse(readFileSync('config.toml', 'utf-8')) as {
  guildId: string;
  autorole: { roleId: string };
  suggestions: { channelId: string };
  autochannel: {
    triggerChannelId: string;
    categoryId: string;
  };
  welcome: { channelId: string };
  tickets: {
    channelId: string;
    categoryId: string;
    adminRoleId: string;
  };
};
