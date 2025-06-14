/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { GuildMember } from 'discord.js';
import { config } from '../config.js';

export async function guildMemberAdd(member: GuildMember) {
    if (member.guild.id !== config.guildId) return;

    const role = member.guild.roles.cache.get(config.autorole.roleId);
    if (role) {
        await member.roles.add(role).catch(() => {});
    }
}
