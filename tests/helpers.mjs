import { readFile } from 'node:fs/promises';
export const ler = async (n) => JSON.parse(await readFile(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
