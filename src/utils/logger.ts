/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

const colorMap: Record<LogLevel, (text: string) => string> = {
    info: (text: string) => `\x1b[34m${text}\x1b[0m`,
    warn: (text: string) => `\x1b[33m${text}\x1b[0m`,
    error: (text: string) => `\x1b[31m${text}\x1b[0m`,
    success: (text: string) => `\x1b[32m${text}\x1b[0m`,
    debug: (text: string) => `\x1b[35m${text}\x1b[0m`,
};

const gray = (text: string) => `\x1b[90m${text}\x1b[0m`;

const log = (level: LogLevel, message: string): void => {
    const time = gray(`[${new Date().toLocaleTimeString('pl-PL')}]`);
    const coloredLevel = colorMap[level](level.toUpperCase());

    console.log(`${time} ${coloredLevel} ${message}`);
};

export const logger = {
    info: (msg: string) => log('info', msg),
    warn: (msg: string) => log('warn', msg),
    error: (msg: string) => log('error', msg),
    success: (msg: string) => log('success', msg),
    debug: (msg: string) => log('debug', msg),
};
