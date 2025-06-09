/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type CategoryChannel,
  ChannelType,
  EmbedBuilder,
  type Guild,
  type GuildChannel,
  type Interaction,
  MessageFlags,
  ModalBuilder,
  type ModalSubmitInteraction,
  PermissionFlagsBits,
  type Role,
  type TextChannel,
  TextInputBuilder,
  TextInputStyle,
  type User,
} from 'discord.js';
import type { Event } from '../types/Event.js';
import { config } from '../utils/config.js';

const TICKET_TYPES = {
  create_ticket_cooperation: { emoji: '🤝', name: 'Współpraca' },
  create_ticket_report: { emoji: '🚨', name: 'Zgłoszenie użytkownika' },
  create_ticket_question: { emoji: '❓', name: 'Pytanie do administracji' },
};

const event: Event = {
  name: 'interactionCreate',
  execute: async (_client, ...args) => {
    const interaction = args[0] as Interaction;

    if (interaction.isButton() && interaction.customId.includes('ticket')) {
      await handleButtonInteraction(interaction);
    } else if (interaction.isModalSubmit() && interaction.customId.includes('ticket')) {
      await handleModalSubmit(interaction);
    }
  },
};

export default event;

async function handleButtonInteraction(interaction: ButtonInteraction) {
  const { customId, guild, user } = interaction;

  if (customId.startsWith('create_ticket_')) {
    if (await hasActiveTicket(guild, user)) {
      await interaction.reply({
        content: 'Masz już aktywne zgłoszenie. Zamknij je przed utworzeniem nowego.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const ticketInfo = TICKET_TYPES[customId as keyof typeof TICKET_TYPES];
    if (!ticketInfo) return;

    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${customId.split('_')[2]}`)
      .setTitle(`${ticketInfo.emoji} ${ticketInfo.name}`);

    const descriptionInput = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Opis zgłoszenia')
        .setPlaceholder(`Opisz szczegółowo swoje ${ticketInfo.name.toLowerCase()}`)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000),
    );

    modal.addComponents(descriptionInput);
    await interaction.showModal(modal);
  }

  if (customId === 'close_ticket') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      await interaction.reply({
        content: 'Nie masz uprawnień do zamykania zgłoszeń.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId('close_ticket_modal')
      .setTitle('Zamknij zgłoszenie');

    const reasonInput = new ActionRowBuilder<TextInputBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId('close_reason')
        .setLabel('Powód zamknięcia')
        .setPlaceholder('Podaj powód zamknięcia zgłoszenia')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(500),
    );

    modal.addComponents(reasonInput);
    await interaction.showModal(modal);
  }
}

async function handleModalSubmit(interaction: ModalSubmitInteraction) {
  const { customId, guild, user } = interaction;

  if (customId.startsWith('ticket_modal_')) {
    const ticketType = customId.split('_')[2];
    const description = interaction.fields.getTextInputValue('ticket_description');

    const typeMap = {
      cooperation: TICKET_TYPES.create_ticket_cooperation,
      report: TICKET_TYPES.create_ticket_report,
      question: TICKET_TYPES.create_ticket_question,
    };

    const { name: typeName } = typeMap[ticketType as keyof typeof typeMap] || typeMap.question;

    const category = guild?.channels.cache.get(config.tickets.categoryId) as
      | CategoryChannel
      | undefined;
    const adminRole = guild?.roles.cache.get(config.tickets.adminRoleId);

    if (!category || !adminRole || !guild) {
      await interaction.reply({
        content: 'Błąd konfiguracji systemu zgłoszeń. Skontaktuj się z administratorem.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (await hasActiveTicket(guild, user)) {
      await interaction.reply({
        content: 'Masz już aktywne zgłoszenie. Zamknij je przed utworzeniem nowego.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const ticketChannel = await createTicketChannel(guild, user, category, adminRole);
    await sendTicketEmbed(ticketChannel, user, typeName, description, adminRole);

    await interaction.reply({
      content: `Zgłoszenie zostało utworzone: ${ticketChannel}`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (customId === 'close_ticket_modal') {
    const reason = interaction.fields.getTextInputValue('close_reason');
    const channel = interaction.channel;

    if (
      !channel ||
      channel.type !== ChannelType.GuildText ||
      !('name' in channel) ||
      !channel.name.includes('🎫')
    ) {
      await interaction.reply({
        content: 'Ten kanał nie jest kanałem zgłoszenia.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const userId = extractUserIdFromChannel(channel);
    const ticketId = extractTicketIdFromChannel(channel);

    if (!userId || !guild) {
      await interaction.reply({
        content: 'Nie mogę znaleźć użytkownika tego zgłoszenia.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const targetUser = await guild.members.fetch(userId).catch(() => null);
    if (targetUser) {
      const dmEmbed = new EmbedBuilder()
        .setTitle('🔒 Zgłoszenie zamknięte')
        .setDescription(
          [
            `Twoje zgłoszenie na serwerze **${guild.name}** zostało zamknięte.`,
            '',
            `• ID: \`${ticketId}\``,
            `• Powód: \`${reason}\``,
            `• Administrator: ${interaction.user}`,
            `• Data: <t:${Math.floor(Date.now() / 1000)}:F>`,
          ].join('\n'),
        )
        .setColor(0xff4757)
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] }).catch(() => {});
    }

    await interaction.reply('Zgłoszenie zostanie zamknięte...');
    await channel.delete().catch(() => {});
  }
}

async function hasActiveTicket(guild: Guild | null, user: User): Promise<boolean> {
  if (!guild) return false;

  const category = guild.channels.cache.get(config.tickets.categoryId) as
    | CategoryChannel
    | undefined;
  if (!category) return false;

  return category.children.cache.some(
    (channel: GuildChannel) =>
      channel.name.includes(user.username) ||
      (channel.type === ChannelType.GuildText &&
        typeof (channel as TextChannel).topic === 'string' &&
        (channel as TextChannel).topic?.includes(`User ID: ${user.id}`)),
  );
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

function extractUserIdFromChannel(channel: GuildChannel): string | null {
  let userIdMatch: RegExpMatchArray | null = null;
  if ('topic' in channel && typeof channel.topic === 'string' && channel.topic) {
    userIdMatch = channel.topic.match(/User ID: (\d+)/);
  }
  return userIdMatch ? userIdMatch[1] : null;
}

function extractTicketIdFromChannel(channel: GuildChannel): string | null {
  let ticketIdMatch: RegExpMatchArray | null = null;
  if ('topic' in channel && typeof channel.topic === 'string' && channel.topic) {
    ticketIdMatch = channel.topic.match(/Ticket ID: (\d+)/);
  }
  if (!ticketIdMatch) {
    ticketIdMatch = channel.name.match(/🎫・(\d+)/);
  }
  return ticketIdMatch ? ticketIdMatch[1] : null;
}
