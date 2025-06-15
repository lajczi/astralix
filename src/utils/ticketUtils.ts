/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    type CategoryChannel,
    ChannelType,
    EmbedBuilder,
    type Guild,
    type GuildChannel,
    type ModalSubmitInteraction,
    PermissionFlagsBits,
    type Role,
    type TextChannel,
    type User,
} from 'discord.js';
import { config } from '../config.js';
import { logger } from './logger.js';

export async function hasActiveTicket(guild: Guild, user: User): Promise<boolean> {
    const category = guild.channels.cache.get(config.tickets.categoryId) as CategoryChannel | undefined;
    if (!category) return false;

    return category.children.cache.some(
        (channel: GuildChannel) =>
            channel.name.includes(user.username) ||
            (channel.type === ChannelType.GuildText &&
                typeof (channel as TextChannel).topic === 'string' &&
                (channel as TextChannel).topic?.includes(`User ID: ${user.id}`)),
    );
}

export async function createTicket(
    interaction: ModalSubmitInteraction,
    typeName: string,
    description: string,
): Promise<TextChannel | undefined> {
    const { guild, user } = interaction;

    if (!guild) return;

    const category = guild.channels.cache.get(config.tickets.categoryId) as CategoryChannel | undefined;
    const adminRole = guild.roles.cache.get(config.tickets.adminRoleId);

    if (!category || !adminRole) {
        logger.error('Category or admin role not found');
        return;
    }

    if (await hasActiveTicket(guild, user)) return;

    try {
        const ticketChannel = await createTicketChannel(guild, user, category, adminRole);
        await sendTicketEmbed(ticketChannel, user, typeName, description, adminRole);
        return ticketChannel;
    } catch (err) {
        logger.error(`Error creating ticket: ${err}`);
        return;
    }
}

async function createTicketChannel(
    guild: Guild,
    user: User,
    category: CategoryChannel,
    adminRole: Role,
): Promise<TextChannel> {
    const ticketId = Date.now().toString().slice(-6);

    return (await guild.channels.create({
        name: `🎫・${ticketId}`,
        type: ChannelType.GuildText,
        parent: category.id,
        topic: `User ID: ${user.id} | Ticket ID: ${ticketId}`,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                ],
            },
            {
                id: adminRole.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.ManageMessages,
                ],
            },
        ],
    })) as TextChannel;
}

async function sendTicketEmbed(
    channel: TextChannel,
    user: User,
    typeName: string,
    description: string,
    adminRole: Role,
) {
    const ticketId = extractTicketIdFromChannel(channel) || 'Unknown';

    const ticketEmbed = new EmbedBuilder()
        .setTitle('🎫 Nowe zgłoszenie')
        .setDescription(
            [
                `• **Kategoria:** ${typeName}`,
                '',
                '• **Szczegóły:**',
                `> ${description}`,
                '',
                `• **Użytkownik:** ${user}`,
                `• **ID zgłoszenia:** \`${ticketId}\``,
                `• **Data utworzenia:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join('\n'),
        )
        .setColor(0x7c3aed)
        .setTimestamp()
        .setThumbnail(user.displayAvatarURL())
        .setFooter({
            text: `ID użytkownika: ${user.id}`,
            iconURL: user.displayAvatarURL(),
        });

    const closeButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Zamknij zgłoszenie')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒'),
    );

    await channel.send({
        content: `${adminRole}`,
        embeds: [ticketEmbed],
        components: [closeButton],
    });
}

export function extractUserIdFromChannel(channel: GuildChannel): string | undefined {
    let userIdMatch: RegExpMatchArray | null | undefined;
    if ('topic' in channel && typeof channel.topic === 'string' && channel.topic) {
        userIdMatch = channel.topic.match(/User ID: (\d+)/);
    }
    return userIdMatch ? userIdMatch[1] : undefined;
}

export function extractTicketIdFromChannel(channel: GuildChannel): string | undefined {
    let ticketIdMatch: RegExpMatchArray | null | undefined;
    if ('topic' in channel && typeof channel.topic === 'string' && channel.topic) {
        ticketIdMatch = channel.topic.match(/Ticket ID: (\d+)/);
    }
    if (!ticketIdMatch) {
        ticketIdMatch = channel.name.match(/🎫・(\d+)/);
    }
    return ticketIdMatch ? ticketIdMatch[1] : undefined;
}
