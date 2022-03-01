import { env as Env } from '../Env';

export const VideoFromFilename = (filename: string): string => {
  return `${Env.Origin}/archive/${filename}`;
};
