import * as Crypto from 'crypto';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import getFolderSize = require('get-folder-size');
import * as Path from 'path';
import { URL } from 'url';
import * as util from 'util';

import { ArchiveRecord } from './Types';

export function UsernameFromUrl(url: string): string {
    const path = (new URL(url)).pathname.split('/');
    return path[1];
}

export function GenFilename(url: string): string {
    const u = new URL(url);
    const buf = Buffer.alloc(3);
    const unique = Crypto.randomFillSync(buf).toString('hex');
    return `${u.hostname}_${UsernameFromUrl(url)}_${dayjs().format(`DDMMYYYYHHmmss`)}_${unique}.mp4`;
}
/**
 * Generate clip filename.
 * @param filename filename returned GenFilename
 */
export function GenClipFilename(filename: string) {
    const buf = Buffer.alloc(3);
    const unique = Crypto.randomFillSync(buf).toString('hex');
    return filename.replace(/([\w+.]+_.+_\d{14}_)([a-f0-9]{6}?)(\.mp4)/, `$1${unique}$3`);
}
/**
 * Parse size string like 300kB to bytes
 * @param size string contain size
 * @returns Rounded number of bytes or NaN
 */
export function SizeStrToByte(size: string): number {
    if (typeof size !== 'string') {
        return NaN;
    }

    const MetricMult = (m: string): number => {
        return Math.pow(1000, ['k', 'M', 'G', 'T'].findIndex(x => x === m) + 1);
    };

    return Math.round(size.endsWith('bit') ?
        Number.parseFloat(size) * MetricMult(size[size.length - 4]) / 8 :
        size.endsWith('B') ?
            Number.parseFloat(size) * MetricMult(size[size.length - 2]) :
            NaN);
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
export function IE<Fn extends (...args: any) => any>(fn: Fn, ...args: any[]): ReturnType<Fn> | null {
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
export function IEM<Fn extends (...args: any) => any>(fn: Fn, context: any, ...args: any[]): ReturnType<Fn> | null {
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
export async function AIE<Fn extends (...args: any) => any>(fn: Fn, ...args: any[]): Promise<ReturnType<Fn> | null> {
    try {
        return await fn(...args);
    } catch (e) {
        return null;
    }
}

export async function FindDanglingEntries(path: string, excludes: string[]) {
    const e = new Set(excludes);
    const readdir = util.promisify(fs.readdir);
    const lstat = util.promisify(fs.lstat);
    return (await Promise.all((await readdir(path))
        .filter(x => x.endsWith('.mp4') && !e.has(x))
        .map(async (x) => ({ filename: x, stat: await AIE(async () => await lstat(Path.join(path, x))) }))))
        .filter(x => x.stat && !x.stat.isDirectory())
        .map(x => ({ filename: x.filename, size: x.stat!.size }));
}

export default async (path: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        getFolderSize(path, (err, size) => err ? reject(err) : resolve(size));
    });
};
