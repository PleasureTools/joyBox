import * as Crypto from 'crypto';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import getFolderSize = require('get-folder-size');
import * as Path from 'path';
import { URL } from 'url';
import * as util from 'util';
import { AxiosError } from 'axios';

export function UsernameFromUrl(url: string): string {
  const path = (new URL(url)).pathname.split('/');
  return path[1];
}
export function GenFilename(url: string): string {
  const u = new URL(url);
  const buf = Buffer.alloc(3);
  const unique = Crypto.randomFillSync(buf).toString('hex');
  return `${u.hostname}_${UsernameFromUrl(url)}_${dayjs().format('DDMMYYYYHHmmss')}_${unique}.mp4`;
}
/**
 * Generate clip filename.
 * @param filename filename returned by GenFilename
 */
export function GenClipFilename(filename: string): string {
  const buf = Buffer.alloc(3);
  const unique = Crypto.randomFillSync(buf).toString('hex');
  return filename.replace(/([\w+.]+_.+_\d{14}_)([a-f0-9]{6}?)(\.mp4)/, `$1${unique}$3`);
}
export function Timestamp(): number {
  return Math.floor(Date.now() / 1000);
}
/**
 * Call function with ignoring any exceptions. Returns null when exception happens.
 * @param fn function to call
 * @param args arguments passed to fn
 * @returns fn function call result
 */
export function IE<Fn extends(...args: any) => any>(fn: Fn, ...args: any[]): ReturnType<Fn> | null {
  try {
    return fn(...args);
  } catch (e) {
    return null;
  }
}
/**
 * Call function with ignoring any exceptions. Returns null when exception happens.
 * @param fn function to call
 * @param context 'this' of method
 * @param args arguments passed to fn
 * @returns fn function call result
 */
export function IEM<Fn extends(...args: any) => any>(fn: Fn, context: any, ...args: any[]): ReturnType<Fn> | null {
  try {
    return fn.bind(context)(...args);
  } catch (e) {
    return null;
  }
}
/**
 * Call async function with ignoring any exceptions. Returns null when exception happens.
 * @param fn function to call
 * @param args arguments passed to fn
 * @returns fn function call result
 */
export async function AIE<Fn extends(...args: any) => any>(fn: Fn, ...args: any[]): Promise<ReturnType<Fn> | null> {
  try {
    return await fn(...args);
  } catch (e) {
    return null;
  }
}
export async function FileSize(filename: string): Promise<number> {
  const stat = await AIE(util.promisify(fs.lstat), filename);
  return Number(stat && stat.size) || -1;
}

export interface DanglingEntrie {
  filename: string;
  size: number;
}

export async function FindDanglingEntries(path: string, excludes: string[]): Promise<DanglingEntrie[]> {
  const e = new Set(excludes);
  const readdir = util.promisify(fs.readdir);
  const lstat = util.promisify(fs.lstat);
  return (await Promise.all((await readdir(path))
    .filter(x => x.endsWith('.mp4') && !e.has(x))
    .map(async (x) => ({ filename: x, stat: await AIE(async () => await lstat(Path.join(path, x))) }))))
    .filter(x => x.stat && !x.stat.isDirectory())
    .map(x => ({ filename: x.filename, size: x.stat!.size }));
}
export function RandomHexString(bytes: number): string {
  return Crypto.randomBytes(bytes).toString('hex');
}
export async function GetFolderSize(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    getFolderSize(path, (err, size) => err ? reject(err) : resolve(size));
  });
}

/**
 * Check if file exists
 * @param filename target file
 * @returns true if file exists, false otherwise
 */
export async function Exists(filename: string): Promise<boolean> {
  try {
    await fs.promises.access(filename, fs.constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}
/**
 * Delete file
 * @param filename target file
 * @returns true if success, false otherwise
 */
export async function Unlink(filename: string): Promise<boolean> {
  try {
    await util.promisify(fs.unlink)(filename);
    return true;
  } catch (e) {
    return false;
  }
}

export async function Rename(source: string, destination: string): Promise<boolean> {
  try {
    await util.promisify(fs.rename)(source, destination);
  } catch (e) {
    return false;
  }

  return true;
}

export interface ParsedObservableUrl {
  provider: string;
  channel: string;
}

export function ParseObservableUrl(url: string): ParsedObservableUrl | null {
  const found = url.match(/([a-z]+\.[a-zA-Z0-9]+)\/([a-zA-Z0-9_-]+)\/*$/);
  return found && found[1] && found[2] ? { provider: found[1], channel: found[2] } : null;
}

export function NormalizeUrl(url: string): string {
  const found = ParseObservableUrl(url);
  return found ? `https://${found.provider}/${found?.channel}` : url;
}

export const isAxiosError = <T>(error: unknown): error is AxiosError<T> => {
  return (error as AxiosError<T>).isAxiosError !== undefined;
};
