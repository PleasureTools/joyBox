export async function Subscribe(VAPIDKey: string) {
    const registration = await navigator.serviceWorker.register('service-worker.js');

    if (await registration.pushManager.getSubscription())
        return null;

    if (!VAPIDKey)
        return null;

    try {
        return await registration.pushManager
            .subscribe({ userVisibleOnly: true, applicationServerKey: UrlBase64ToUint8Array(VAPIDKey) });
    } catch (e) {
        return null;
    }
}

export async function Unsubscribe() {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration)
        return;

    const subscription = await registration.pushManager.getSubscription();

    if (!subscription)
        return;

    await subscription.unsubscribe();
    await registration.unregister();
}

export async function RetrieveEndpoint() {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration)
        return '';

    const subscription = await registration.pushManager.getSubscription();

    if (!subscription)
        return '';

    return subscription.endpoint;
}

function UrlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
