self.addEventListener('push', e => {
    const data = e.data.json();
    e.waitUntil(self.registration.showNotification(data.title, data));
});

self.addEventListener('notificationclick', async e => {
    e.waitUntil(ShowPlayerTab(e));
})

async function ShowPlayerTab(e) {
    const tabs = await clients.matchAll({ type: 'window' });
    const openedPlayer = tabs.find(x => x.url == self.origin + e.notification.data.url);

    e.notification.close();
    return openedPlayer ? openedPlayer.focus() : clients.openWindow(e.notification.data.url);
}

self.addEventListener('fetch', e => {
    if (!(e.request.url.startsWith(self.location.origin + '/archive/') && e.request.url.endsWith('.mp4')) || self.auth_free)
        return;

    e.respondWith((async () => {
        if (!self.accessToken) {
            const msgWaiter = new Promise(ok => self.tokenReceived = ok);
            const client = await clients.get(e.clientId);
            client.postMessage('auth_req');
            await msgWaiter;
        }

        const headers = new Headers(e.request.headers);
        headers.append('Authorization', self.accessToken);

        return fetch(e.request.url, { headers });
    })());
});

self.addEventListener('message', e => {
    switch (e.data.type) {
        case 'auth_req':
            self.auth_free = false;
            self.accessToken = e.data.token;
            self.tokenReceived && self.tokenReceived();
            break;
        case 'auth_free':
            self.auth_free = true;
            break;
        case 'invalidate_token':
            delete self.accessToken;
            break;
    }
});