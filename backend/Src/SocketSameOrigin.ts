import { URL } from 'url';

import { Config } from './BootstrapConfiguration';

export const SocketSameOrigin = (origin: string, cb: (error: string | null, success: boolean) => void) => {
    const o = new URL(origin);
    const oPort = parseInt(o.port, 10);

    if (o.protocol === (Config.IsSecure ? 'https:' : 'http:') &&
        o.hostname === Config.Hostname &&
        (isNaN(oPort) ?
            Config.IsSecure ?
                Config.Port === 443 :
                Config.Port === 80 :
            Config.IsDev || oPort === Config.Port))
        return cb(null, true);

    cb('origin not allowed', false);
};