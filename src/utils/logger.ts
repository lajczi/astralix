/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import chalk from 'chalk';

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

const colorMap: Record<LogLevel, (text: string) => string> = {
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  success: chalk.green,
  debug: chalk.magenta,
};
const log = (level: LogLevel, message: string): void => {
  const time = chalk.gray(`[${new Date().toLocaleTimeString('pl-PL')}]`);
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
