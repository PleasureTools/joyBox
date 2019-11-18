import * as sqlite3 from 'better-sqlite3';
import * as fs from 'fs';

import { IEM } from './Common/Util';
import { DATA_FOLDER, DB_LOCATION, TLS_CERTIFICATE, TLS_PRIVATE_KEY, VAPID_CONFIG } from './Constants';

interface VAPIDDetails {
    subject: string;
    privateKey: string;
    publicKey: string;
}
type VAPIDDetailsRef = VAPIDDetails | null;
class BootstrapConfiguration {
    private isDataMounted: boolean = false;
    private isInitialized: boolean = false;
    private isSecure: boolean = false;
    private port: number = 8080;
    private vapidDetails: VAPIDDetailsRef = null;
    private startTime: number = Date.now();

    constructor() {
        this.DetectConfiguration();
    }

    public get IsDataMounted() { return this.isDataMounted; }
    public get IsInitialized() { return this.isInitialized; }
    public get IsSecure() { return this.isSecure; }
    public get Port() { return this.port; }
    public get WebPushEnabled() { return this.vapidDetails !== null; }
    public get VAPID() { return this.vapidDetails; }
    public get StartTime() { return this.startTime; }

    private DetectConfiguration() {
        this.CheckIsDataMounted();

        if (!this.IsDataMounted)
            return;

        this.CheckIsInitialized();
        this.CheckTLSAvailability();
        this.IdentifyPort();
        IEM(this.CheckNWebPushAvailability, this);
    }

    private CheckIsDataMounted() {
        this.isDataMounted = fs.existsSync(DATA_FOLDER);
    }

    private CheckIsInitialized() {
        const db: sqlite3.Database = new sqlite3(DB_LOCATION);
        const requiredTables = ['observables', 'observablePlugins', 'plugins', 'archive'];

        const tblExistStmt = db.prepare(
            'SELECT count(*) as exist FROM sqlite_master WHERE type=\'table\' AND name=(?)'
        );
        this.isInitialized = requiredTables
            .map(x => tblExistStmt.get(x).exist === 1)
            .every(x => x);

        db.close();
    }

    private CheckTLSAvailability() {
        this.isSecure = fs.existsSync(TLS_PRIVATE_KEY) && fs.existsSync(TLS_CERTIFICATE);
    }

    private IdentifyPort() {
        this.port = parseInt(process.env.PORT as string, 10) || this.IsSecure && 443 || 80;
    }

    private CheckNWebPushAvailability() {
        this.vapidDetails = JSON.parse(fs.readFileSync(VAPID_CONFIG, 'utf-8'));
    }
}

export const Config = new BootstrapConfiguration();
