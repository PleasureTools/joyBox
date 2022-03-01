import { env as Env } from '../Env';

export const ThumbnailFromFilename = (filename: string): string => {
  return `${Env.Origin}/archive/thumbnail/${filename.slice(0, filename.lastIndexOf('.'))}.jpg`;
};
