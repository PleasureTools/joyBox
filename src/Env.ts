export interface Env {
    readonly Host: string;
    readonly Protocol: string;
    readonly Origin: string;
    readonly Secure: boolean;
}

const Host = process.env.VUE_APP_HOST || location.host;
const Protocol = location.protocol;
const Origin = `${Protocol}//${Host}`;
const IsSecure = () => Protocol === 'https:';

export const env: Env = { Host, Protocol, Origin, Secure: IsSecure() };
