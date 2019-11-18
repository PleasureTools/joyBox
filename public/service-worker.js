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

    return openedPlayer ? openedPlayer.focus() : clients.openWindow(e.notification.data.url);
}