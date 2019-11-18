import { StreamExtractor } from '../Plugin';

export class DummyExtractor implements StreamExtractor {
    public Extract(uri: string): Promise<string> {
        return new Promise((resolve, reject) => {
            resolve('dummy://path/to/stream');
        });
    }
    public CanParse(uri: string): boolean {
        return uri.length > 2;
    }
}
