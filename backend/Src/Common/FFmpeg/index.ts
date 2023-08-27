export interface FFMpegProgressInfo {
  bitrate: string; // 3626.3kbits/s
  eta: any;
  fps: number;
  frame: number;
  progress: any;
  q: number;
  size: string; // 21248kB
  Lsize: string;
  speed: number;
  time: number; // milliseconds
}
export { ClipMaker, ReencodingMode } from './ClipMaker';
export { FileNotFoundException } from './Exceptions';
export { MediaInfo } from './MediaInfo';
export { ThumbnailGenerator } from './ThumbnailGenerator';
