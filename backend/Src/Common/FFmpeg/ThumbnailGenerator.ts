import { spawn } from 'child_process';

/**
 * @param source path to source
 * @param position position from start where thumbnail will be taken, in seconds
 * @param destination path to save thumbnail
 */
export class ThumbnailGenerator {
    public Generate(source: string, position: number, destination: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg',
                ['-loglevel', 'error',
                    '-ss', position.toString(),
                    '-i', source,
                    '-vframes', '1', `${destination}.jpg`]);
            ffmpeg.once('error', () => reject(false));
            ffmpeg.once('close', () => resolve(true));
        });
    }
}
