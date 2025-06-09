/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ActivityType,
  type ChatInputCommandInteraction,
  type ClientEvents,
  Collection,
  Client as DiscordClient,
  GatewayIntentBits,
  type Interaction,
  MessageFlags,
  type PermissionResolvable,
  PresenceUpdateStatus,
} from 'discord.js';
import type { Command } from '../types/Command.js';
import type { Event } from '../types/Event.js';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class Client extends DiscordClient {
  public readonly commands = new Collection<string, Command>();
  private readonly cooldowns = new Collection<string, Collection<string, number>>();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
      presence: {
        status: PresenceUpdateStatus.DoNotDisturb,
        activities: [{ name: 'Spotify', type: ActivityType.Listening }],
      },
    });

    this.on('interactionCreate', this.handleInteraction.bind(this));
  }

  private getRemainingTime(userId: string, commandName: string): number {
    const userCooldowns = this.cooldowns.get(commandName);
    if (!userCooldowns) return 0;

    const cooldown = userCooldowns.get(userId) ?? 0;
    return cooldown > Date.now() ? (cooldown - Date.now()) / 1000 : 0;
  }

  private setCooldown(userId: string, commandName: string, duration: number): void {
    if (!this.cooldowns.has(commandName)) {
      this.cooldowns.set(commandName, new Collection());
    }
    this.cooldowns.get(commandName)?.set(userId, Date.now() + duration * 1000);
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (interaction.isChatInputCommand()) {
      await this.handleSlashCommand(interaction);
    }
  }

  private async handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    const command = this.commands.get(interaction.commandName);
    if (!command) return;

    if (command.cooldown) {
      const remaining = this.getRemainingTime(interaction.user.id, command.name);
      if (remaining > 0) {
        await interaction.reply({
          content: `⏳ Poczekaj jeszcze \`${remaining.toFixed(1)}\` sekund przed ponownym użyciem tej komendy.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      this.setCooldown(interaction.user.id, command.name, command.cooldown);
    }

    if (command.deferReply) {
      await interaction.deferReply({
        flags: command.ephemeral ? MessageFlags.Ephemeral : undefined,
      });
    }

    await command.execute(interaction, this);
  }

  private async loadCommands(): Promise<void> {
    const commandsPath = join(__dirname, '..', 'commands');
    const files = await readdir(commandsPath);

    for (const file of files) {
      if (!file.endsWith('.js')) continue;
      const command: Command = (await import(`file://${join(commandsPath, file)}`)).default;
      if (command.enabled !== false) {
        this.commands.set(command.name, command);
      }
    }

    await this.application?.commands.set(
      [...this.commands.values()].map((command) => ({
        name: command.name,
        description: command.description,
        options: command.options,
        defaultMemberPermissions: command.defaultMemberPermissions as PermissionResolvable | null,
      })),
    );

    logger.info(`Loaded ${this.commands.size} commands`);
  }

  private async loadEvents(): Promise<void> {
    const eventsPath = join(__dirname, '..', 'events');
    const files = await readdir(eventsPath);

    for (const file of files) {
      if (!file.endsWith('.js')) continue;
      const event: Event = (await import(`file://${join(eventsPath, file)}`)).default;
      const execute = (...args: ClientEvents[keyof ClientEvents]) => event.execute(this, ...args);
      if (event.once) {
        this.once(event.name, execute);
      } else {
        this.on(event.name, execute);
      }
    }

    logger.info(`Loaded ${files.length} events`);
  }

  async start(token: string): Promise<void> {
    await this.login(token);
    await this.loadEvents();
    await this.loadCommands();
    logger.success(`Logged in as ${this.user?.tag}`);
  }
}
