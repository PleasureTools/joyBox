import { SqliteAdapter } from './Services/SqliteAdapter';

export class Settings {
    public static readonly STORAGE_QUOTA_PROP = 'storageQuota';
    private static readonly INSTANCE_QUOTA_PROP = 'instanceQuota';
    private static readonly DOWNLOAD_SPEED_QUOTA_PROP = 'downloadSpeedQuota';
    private static readonly PropList =
        [Settings.STORAGE_QUOTA_PROP, Settings.INSTANCE_QUOTA_PROP, Settings.DOWNLOAD_SPEED_QUOTA_PROP] as const;
    private storageQuota!: number;
    private instanceQuota!: number;
    private downloadSpeedQuota!: number;
    public constructor(private storage: SqliteAdapter) {
        this.Load();
    }
    public get StorageQuota() { return this.storageQuota; }
    public set StorageQuota(quota: number) {
        this.UpdateProperty(Settings.STORAGE_QUOTA_PROP, quota);
    }
    public get InstanceQuota() { return this.instanceQuota; }
    public set InstanceQuota(quota: number) {
        this.UpdateProperty(Settings.INSTANCE_QUOTA_PROP, quota);
    }
    public get DownloadSpeedQuota() { return this.downloadSpeedQuota; }
    public set DownloadSpeedQuota(quota: number) {
        this.UpdateProperty(Settings.DOWNLOAD_SPEED_QUOTA_PROP, quota);
    }
    private Load() {
        const settings = this.storage.FetchSettings();
        this.storageQuota = settings.storageQuota;
        this.instanceQuota = settings.instanceQuota;
        this.downloadSpeedQuota = settings.downloadSpeedQuota;
    }
    private UpdateProperty<V>(prop: typeof Settings.PropList[number], value: string | number) {
        if (value !== this.GetLocal(prop)) {
            this.SetLocal(prop, value);
            this.storage.UpdateSettingProperty(prop, value);
        }
    }
    private GetLocal(prop: typeof Settings.PropList[number]): string | number {
        switch (prop) {
            case Settings.STORAGE_QUOTA_PROP:
                return this.storageQuota;
            case Settings.INSTANCE_QUOTA_PROP:
                return this.instanceQuota;
            case Settings.DOWNLOAD_SPEED_QUOTA_PROP:
                return this.downloadSpeedQuota;
        }
    }
    private SetLocal(prop: typeof Settings.PropList[number], value: number | string) {
        switch (prop) {
            case Settings.STORAGE_QUOTA_PROP:
                this.storageQuota = value as number;
                break;
            case Settings.INSTANCE_QUOTA_PROP:
                this.instanceQuota = value as number;
                break;
            case Settings.DOWNLOAD_SPEED_QUOTA_PROP:
                this.downloadSpeedQuota = value as number;
                break;
        }
    }
}
