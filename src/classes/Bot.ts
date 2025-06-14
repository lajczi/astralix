/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readdir } from 'node:fs/promises';
import { ActivityType, Client, Collection, GatewayIntentBits, PresenceUpdateStatus } from 'discord.js';
import type { Command, MessageComponent, Modal } from '../types/Interactions.js';

export class Bot extends Client {
    commands: Collection<string, Command> = new Collection();
    modals: Map<string, Modal> = new Map();
    components: Map<string, MessageComponent> = new Map();
    events: Map<string, any> = new Map();

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
        this.init();
    }

    async init() {
        this.commands = await this.loadCommands();
        this.events = await this.loadEvents();
        this.modals = (await this.loadFolder<Modal>(new URL('../modals', import.meta.url))).files;
        this.components = (await this.loadFolder<MessageComponent>(new URL('../components', import.meta.url))).files;

        await this.login(process.env.TOKEN);
    }

    async loadEvents() {
        const path = new URL('../events', import.meta.url);
        const { files } = await this.loadFolder(path);
        const events = new Map();
        for (const [name, event] of files) {
            events.set(name, event);
            this.on(name, (...args) => (event as any)[name](this, ...args));
        }
        return events;
    }

    async loadCommands(): Promise<Collection<string, Command>> {
        const path = new URL('../commands', import.meta.url);
        const { files, directoriesFound } = await this.loadFolder<Command>(path);
        const commands = new Collection<string, Command>();
        for (const [name, command] of files) {
            commands.set(name, command);
        }
        for (const directory of directoriesFound) {
            const dirPath = new URL(`../commands/${directory}`, import.meta.url);
            const { files } = await this.loadFolder<Command>(dirPath);
            for (const [name, command] of files) {
                commands.set(`${directory}/${name}`, command);
            }
        }
        return commands;
    }

    async loadFolder<T>(folder: string | URL): Promise<{ files: Map<string, T>; directoriesFound: string[] }> {
        const files = new Map();
        const directory = await readdir(folder).catch(() => undefined);
        const directoriesFound: string[] = [];
        if (!directory) return { files, directoriesFound };
        for (const file of directory) {
            if (!file.endsWith('.js')) {
                directoriesFound.push(file);
                continue;
            }
            const filePath = `${folder}/${file}`;
            const data = await import(filePath);
            files.set(file.split('.')[0], data);
        }
        return { files, directoriesFound };
    }
}
