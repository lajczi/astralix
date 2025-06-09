/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { VoiceState } from 'discord.js';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import type { Event } from '../types/Event.js';
import { config } from '../utils/config.js';

const createdChannels = new Map<string, string>();

const event: Event = {
  name: 'voiceStateUpdate',
  execute: async (_client, ...args) => {
    const [oldState, newState] = args as [VoiceState, VoiceState];
    if (newState.guild?.id !== config.guildId) return;

    // create temporary channel when user joins trigger channel
    if (newState.channelId === config.autochannel.triggerChannelId && newState.member) {
      const { guild, member } = newState;

      const channel = await guild.channels.create({
        name: `🎤・ ${member.displayName}`,
        type: ChannelType.GuildVoice,
        parent: config.autochannel.categoryId,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.Connect] },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
            ],
          },
        ],
      });

      await member.voice.setChannel(channel).catch(() => {});
      createdChannels.set(member.id, channel.id);
    }

    // delete empty temporary channel
    if (oldState.channelId && oldState.guild) {
      const channel = oldState.guild.channels.cache.get(oldState.channelId);
      if (
        channel?.type === ChannelType.GuildVoice &&
        channel.members.size === 0 &&
        channel.parentId === config.autochannel.categoryId &&
        [...createdChannels.values()].includes(channel.id)
      ) {
        await channel.delete().catch(() => {});
        for (const [userId, channelId] of createdChannels.entries()) {
          if (channelId === channel.id) {
            createdChannels.delete(userId);
            break;
          }
        }
      }
    }
  },
};

export default event;
