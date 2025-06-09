/*
 * Copyright (c) 2025 lajczi
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as esbuild from 'esbuild';

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: ['src/**/*.ts'],
  outdir: 'dist',
  platform: 'node',
  format: 'esm',
  target: 'node22',
  logLevel: 'info',
  bundle: false,
  outExtension: { '.js': '.js' },
};

await esbuild.build(options);
