/*
 * Copyright (c) 2026 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
import { createHash } from 'crypto';
import { machineId } from 'node-machine-id';

/**
 * The hardware key identifies the display in the CMS. It is resolved in this order:
 *   1. XIBO_HARDWARE_KEY environment variable (set by hand, wins over the saved key)
 *   2. hardwareKey saved in config.json
 *   3. generated from the machine id
 *
 * The machine id is the same for every player on the machine, so a generated key alone would
 * make two players (e.g. snap parallel instances xibo-player and xibo-player_2) register as
 * the same display. For a parallel instance the instance name is mixed in, so each instance
 * gets its own stable key. The main instance keeps the plain machine id key, so existing
 * single-player installs are unchanged.
 */
export const HARDWARE_KEY_ENV = 'XIBO_HARDWARE_KEY';

const MAX_HARDWARE_KEY_LENGTH = 40;

/** The hardware key set by hand in the environment, or null. */
export function getHardwareKeyOverride(): string | null {
  const value = (process.env[HARDWARE_KEY_ENV] ?? '').trim();
  return value === '' ? null : value.substring(0, MAX_HARDWARE_KEY_LENGTH);
}

/**
 * Name of this snap parallel instance (the part after `_`, e.g. "2" for xibo-player_2),
 * or null when this is not a parallel instance.
 */
export function getInstanceKey(): string | null {
  const key = (process.env['SNAP_INSTANCE_KEY'] ?? '').trim();
  return key === '' ? null : key;
}

/** Generates a hardware key for this machine, unique per snap parallel instance. */
export async function generateHardwareKey(): Promise<string> {
  const id = await machineId();
  const instanceKey = getInstanceKey();

  if (instanceKey === null) {
    return id.substring(0, MAX_HARDWARE_KEY_LENGTH);
  }

  return createHash('sha256')
    .update(`${id}:${instanceKey}`)
    .digest('hex')
    .substring(0, MAX_HARDWARE_KEY_LENGTH);
}
