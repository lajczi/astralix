/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import type { Bot } from './classes/Bot.js';

const parsedCommands: SlashCommandBuilder[] = [];

export async function deploy(client: Bot) {
    const commands = client.commands;
    if (parsedCommands.length === 0) {
        commands.forEach((cmd, key) => {
            if (key.includes('/')) {
                const [name, subcommand] = key.split('/');
                if (subcommand !== 'index') return;
                const subcommands = commands.filter(
                    (_value, key) => key.startsWith(`${name}/`) && key !== `${name}/index`,
                );
                const command = cmd.data;
                subcommands.forEach((subcmd) => {
                    command.addSubcommand(subcmd.data as any as SlashCommandSubcommandBuilder);
                });
                parsedCommands.push(command);
            } else {
                parsedCommands.push(cmd.data);
            }
        });
    }
    await client.application?.commands.set(parsedCommands);
}
