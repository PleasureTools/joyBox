import { env } from '../Env';
import { PushService } from './PushService';
import { ServiceWorker } from './ServiceWorker';

const push = new PushService();

const serviceWorker = new ServiceWorker();

if (env.Secure)
    serviceWorker.Start();

export default { push, serviceWorker };
