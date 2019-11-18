import * as fs from 'fs';
import { Server as HTTPServer } from 'http';
import { Server as HTTPSServer } from 'https';

import { Config } from './BootstrapConfiguration';
import { TLS_CERTIFICATE, TLS_PRIVATE_KEY } from './Constants';

export class WebServerFactory {
    public Create() {
        return Config.IsSecure ? new HTTPSServer(this.TLSOptions()) : new HTTPServer();
    }

    private TLSOptions() {
        return {
            key: fs.readFileSync(TLS_PRIVATE_KEY, 'utf8'),
            cert: fs.readFileSync(TLS_CERTIFICATE, 'utf8')
        };
    }
}
