import { spawn } from 'child_process';
import { access, constants } from 'fs';
import * as JSONStream from 'JSONStream';
import { Transform, TransformCallback } from 'stream';

export interface Disposition {
    default: number;
    dub: number;
    original: number;
    comment: number;
    lyrics: number;
    karaoke: number;
    forced: number;
    hearing_impaired: number;
    visual_impaired: number;
    clean_effects: number;
    attached_pic: number;
    timed_thumbnails: number;
}

export interface Tags {
    language: string;
    handler_name: string;
}

export interface StreamInfo {
    index: number;
    codec_name: string;
    codec_long_name: string;
    profile: string;
    codec_type: string;
    codec_time_base: string;
    codec_tag_string: string;
    codec_tag: string;
    width: number;
    height: number;
    coded_width: number;
    coded_height: number;
    has_b_frames: number;
    pix_fmt: string;
    level: number;
    chroma_location: string;
    refs: number;
    is_avc: string;
    nal_length_size: string;
    r_frame_rate: string;
    avg_frame_rate: string;
    time_base: string;
    start_pts: number;
    start_time: string;
    duration_ts: number;
    duration: string;
    bit_rate: string;
    bits_per_raw_sample: string;
    nb_frames: string;
    disposition: Disposition;
    tags: Tags;
}

class TransformToString extends Transform {
    constructor() {
        super({ objectMode: true });
    }
    public _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
        callback(null, chunk.toString());
    }
}
export class FileNotFoundException extends Error { }
export class StreamRecordInfo {
    private toString: TransformToString = new TransformToString();

    /**
     *  Extract media info from first v-stream
     * @param filename path to media file.
     */
    public Info(filename: string): Promise<StreamInfo> {
        return new Promise(async (resolve, reject) => {
            // Костиль из-за ERR_STREAM_WRITE_AFTER_END в ffprobe
            if (!await this.Exist(filename)) {
                reject(new FileNotFoundException(`File ${filename} not found.`));
                return;
            }

            const opts = ['-loglevel', 'error',
                '-show_streams', '-select_streams',
                'v:0', '-print_format',
                'json=compact=1', filename];
            const ffprobe = spawn('ffprobe', opts, { detached: true });
            ffprobe.stdout
                .pipe(JSONStream.parse('*'))
                .once('data', (data: StreamInfo[]) => resolve(data[0]));
            ffprobe.stderr
                .pipe(this.toString)
                .once('data', (data: string) => reject(new Error(data)));
        });
    }

    private Exist(filename: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            access(filename, constants.F_OK, (err) => {
                resolve(err === null);
            });
        });
    }
}
