export function ExtractSourceFromUrl(sourceUrl: string) {
    const protoWithSource = sourceUrl.split(':');
    return protoWithSource.length === 2 ? protoWithSource[1].slice(2) : sourceUrl;
}

export function UrlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
