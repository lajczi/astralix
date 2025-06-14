/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { GuildMember } from 'discord.js';
import type { Event } from '../types/Event.js';
import { config } from '../config.js';

const event: Event = {
  name: 'guildMemberAdd',
  execute: async (_client, ...args) => {
    const member = args[0] as GuildMember;
    if (member.guild.id !== config.guildId) return;

    // handle autorole
    const role = member.guild.roles.cache.get(config.autorole.roleId);
    if (role) {
      await member.roles.add(role).catch(() => {});
    }
  },
};

export default event;
