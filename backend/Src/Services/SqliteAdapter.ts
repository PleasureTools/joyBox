/* eslint-disable no-multi-str */
import * as Sqlite3 from 'better-sqlite3';
import { PushSubscription } from 'web-push';

import { ArchiveRecord, Filter, LogItem, NotificationType, Playlist, Plugin } from '@Shared/Types';
import { ClientSubscription, ObservableStream } from '../Common/Types';

interface StreamRecord {
  url: string;
  lastSeen: number;
  download: number;
  valid: number;
  plugin: string;
}

interface Stream {
  url: string;
  lastSeen: number;
  download: number;
  valid: boolean;
  plugins: string[];
}

interface PluginRecord {
  id: number;
  name: string;
  enabled: boolean;
}
interface SettingsItem {
  property: string;
  value: string;
}
interface Settings {
  storageQuota: number;
  instanceQuota: number;
  downloadSpeedQuota: number;
  remoteSeleniumUrl: string;
}
interface PlaylistSegmentSerialized {
  playlist: number;
  order: number;
  filename: string;
  begin: number;
  end: number;
  loop: number;
}
interface PlaylistSerialized {
  id: number;
  name: string;
  thumbnail: string;
  timestamp: number;
}
export class SqliteAdapter {
  constructor(private db: Sqlite3.Database) { }

  public Initialize(plugins: string[]): void {
    this.db
      .exec('CREATE TABLE IF NOT EXISTS observables (\
                id INTEGER PRIMARY KEY, \
                url TEXT UNIQUE COLLATE NOCASE, \
                lastSeen INTEGER DEFAULT -1, \
                download INTEGER DEFAULT 0, \
                valid INTEGER default 1, \
                removed INTEGER DEFAULT 0 \
                )')
      .exec('CREATE TABLE IF NOT EXISTS plugins (\
                id INTEGER PRIMARY KEY, \
                name TEXT, \
                enabled INTEGER, \
                priority INTEGER\
                )')
      .exec('CREATE TABLE IF NOT EXISTS observablePlugins (\
                observable INTEGER,\
                plugin INTEGER,\
                priority INTEGER, \
            CONSTRAINT fkObservable FOREIGN KEY (observable) REFERENCES observables(id) ON DELETE CASCADE, \
            CONSTRAINT fkPlugin FOREIGN KEY (plugin) REFERENCES plugins(id))')
      .exec('CREATE TABLE IF NOT EXISTS archive (\
                id INTEGER PRIMARY KEY, \
                title TEXT, \
                source TEXT, \
                timestamp INTEGER, \
                duration INTEGER NOT NULL DEFAULT -1, \
                size INTEGER NOT NULL DEFAULT -1, \
                re_encoded INTEGER NOT NULL DEFAULT 0, \
                filename TEXT UNIQUE)')
      .exec('CREATE TABLE IF NOT EXISTS tags (\
                id INTEGER PRIMARY KEY, \
                text TEXT UNIQUE COLLATE NOCASE)')
      .exec('CREATE TABLE IF NOT EXISTS archiveTags (\
                record INTEGER, \
                tag INTEGER, \
                CONSTRAINT fkRecord FOREIGN KEY (record) REFERENCES archive(id) ON DELETE CASCADE, \
                UNIQUE(record, tag))')
      .exec('CREATE TRIGGER archiveTagGC \
                AFTER DELETE ON archiveTags \
                WHEN NOT EXISTS (SELECT 1 FROM archiveTags WHERE tag = old.tag)\
                BEGIN \
                    DELETE FROM tags WHERE id = old.tag; \
                END;')
      .exec('CREATE TABLE IF NOT EXISTS subscriptions (\
                endpoint TEXT PRIMARY KEY, \
                auth TEXT, \
                p256dh TEXT)')
      .exec('CREATE TABLE IF NOT EXISTS subscriptionNotifications (\
                endpoint TEXT NOT NULL, \
                notification INTEGER NOT NULL, \
                PRIMARY KEY (endpoint, notification) \
                CONSTRAINT fkEndpoint FOREIGN KEY (endpoint) REFERENCES subscriptions(endpoint) ON DELETE CASCADE);')
      .exec('CREATE TRIGGER subscriptionsGC \
                AFTER DELETE ON subscriptionNotifications \
                WHEN NOT EXISTS (SELECT 1 FROM subscriptionNotifications WHERE endpoint = old.endpoint)\
                BEGIN \
                    DELETE FROM subscriptions WHERE endpoint = old.endpoint; \
                END;')
      .exec('BEGIN; \
            CREATE TABLE IF NOT EXISTS log (\
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, \
                message TEXT ); \
                CREATE INDEX log_timestamp ON log (timestamp);\
                COMMIT;')
      .exec('CREATE TABLE IF NOT EXISTS settings (\
                property TEXT PRIMARY KEY, \
                value TEXT)')
      .exec('CREATE TABLE IF NOT EXISTS archiveFilter (\
                id INTEGER PRIMARY KEY, \
                name TEXT, \
                query TEXT)')
      .exec('CREATE TABLE IF NOT EXISTS observablesFilter (\
                id INTEGER PRIMARY KEY, \
                name TEXT, \
                query TEXT)')
      .exec('CREATE TABLE IF NOT EXISTS playlist (\
                id INTEGER PRIMARY KEY, \
                title TEXT NOT NULL, \
                timestamp INTEGER NOT NULL)')
      .exec('BEGIN; \
                CREATE TABLE IF NOT EXISTS playlistSegments (\
                playlist INTEGER NOT NULL, \
                \'order\' INTEGER NOT NULL, \
                record INTEGER NOT NULL, \
                begin INTEGER NOT NULL, \
                end INTEGER NOT NULL, \
                loop INTEGER NOT NULL, \
                CONSTRAINT fkRecord FOREIGN KEY (record) REFERENCES archive(id) ON DELETE CASCADE, \
                CONSTRAINT fkPlaylist FOREIGN KEY (playlist) REFERENCES playlist(id) ON DELETE CASCADE, \
                UNIQUE(playlist, \'order\')); \
                CREATE INDEX playlistSegmentPlaylist ON playlistSegments (playlist); \
                CREATE INDEX playlistSegmentRecord ON playlistSegments (record); \
                COMMIT;')
      .exec('CREATE TRIGGER playlistGC \
                AFTER DELETE ON playlistSegments \
                WHEN NOT EXISTS (SELECT 1 FROM playlistSegments WHERE playlist = old.playlist)\
                BEGIN \
                    DELETE FROM playlist WHERE id = old.playlist; \
                END;');

    const addPluginStmt = this.db.prepare(
      'INSERT INTO plugins (name, enabled, priority) VALUES (@name, true, @priority)'
    );

    for (let priority = 0; priority < plugins.length; ++priority) {
      addPluginStmt.run({ name: plugins[priority], priority });
    }

    const initSettingProp = this.db.prepare('INSERT INTO settings (property, value) VALUES (@property, @value)');
    initSettingProp.run({ property: 'storageQuota', value: JSON.stringify(0) });
    initSettingProp.run({ property: 'instanceQuota', value: JSON.stringify(0) });
    initSettingProp.run({ property: 'downloadSpeedQuota', value: JSON.stringify(0) });
    initSettingProp.run({ property: 'remoteSeleniumUrl', value: JSON.stringify('') });
  }

  public IsInitialized(): boolean {
    const requiredTables = ['observables', 'observablePlugins', 'plugins', 'archive'];

    const tblExistStmt = this.db.prepare(
      'SELECT count(*) as exist FROM sqlite_master WHERE type=\'table\' AND name=(?)'
    );
    return requiredTables
      .map(x => tblExistStmt.get(x).exist === 1)
      .every(x => x);
  }

  public AddObservable(observable: ObservableStream): boolean {
    const addObservableStmt = this.db.prepare('INSERT INTO observables (url) VALUES (@url)');
    const addObservablePluginStmt = this.db.prepare('INSERT INTO observablePlugins (observable, plugin, priority) \
                                                         VALUES(@observableId, @plugin, @priority)');

    const AddObservableQuery = this.db.transaction((o: ObservableStream) => {
      const insertResult = addObservableStmt.run({ url: o.url });
      o.plugins
        .forEach((x, priority) => addObservablePluginStmt.run({ observableId: insertResult.lastInsertRowid, plugin: x.id, priority }));
    });

    return this.CallTrasnaction(AddObservableQuery, observable);
  }

  public FindObservable(url: string): Stream | null {
    const o = this.db.prepare('SELECT o.url as url, p.name as plugin, o.lastSeen as lastSeen, o.download as download, o.valid as valid \
      FROM observablePlugins op \
      LEFT JOIN plugins p ON op.plugin = p.id \
      LEFT JOIN observables o ON op.observable = o.id \
      WHERE o.url=@url \
      ORDER BY op.priority')
      .all({ url });

    if (o.length === 0) {
      return null;
    }

    return { url, lastSeen: o[0].lastSeen, download: o[0].download, valid: !!o[0].valid, plugins: o.map(x => x.plugin) };
  }

  public RestoreObservable(url: string): boolean {
    return this.db.prepare('UPDATE observables SET removed = 0 WHERE url=@url')
      .run({ url })
      .changes > 0;
  }

  public UpdateLastSeen(url: string, lastSeen = Date.now()): boolean {
    return this.db.prepare('UPDATE observables SET lastSeen = @lastSeen WHERE url = @url')
      .run({ url, lastSeen })
      .changes > 0;
  }

  public UpdateValidity(url: string, validity: boolean): boolean {
    return this.db.prepare('UPDATE observables SET valid = @validity WHERE url = @url')
      .run({ url, validity: +validity })
      .changes > 0;
  }

  public RemoveObservable(url: string): boolean {
    return this.db.prepare('UPDATE observables SET removed = 1 WHERE url=@url')
      .run({ url })
      .changes > 0;
  }

  public ReorderPlugin(source: number, dest: number): boolean {
    if (source === dest) { return true; }

    // If indexes adjacent, only swap needed
    if (Math.abs(source - dest) === 1) {
      const swapPrior = this.db.prepare('UPDATE plugins SET priority = CASE \
            WHEN priority = @source THEN @dest \
            WHEN priority = @dest THEN @source \
        END \
            WHERE priority = @source OR priority = @dest');

      swapPrior.run({ source, dest });

      return true;
    }

    const [lo, hi] = source < dest ? [source, dest] : [dest, source];
    const offset = source < dest ? -1 : +1;
    const stmt = this.db.prepare('UPDATE plugins SET priority = CASE \
            WHEN priority = @source THEN @dest \
            ELSE priority + @offset \
        END \
            WHERE priority BETWEEN @lo AND @hi \
        ');

    stmt.run({ source, dest, lo, hi, offset });

    return true;
  }

  public EnablePlugin(pluginId: number, enabled: boolean): boolean {
    const setEnabledStmt = this.db.prepare('UPDATE plugins SET enabled = @enabled WHERE id = @pluginId');
    setEnabledStmt.run({ pluginId, enabled: enabled ? 1 : 0 });
    return true;
  }

  public ReorderObservablePlugin(url: string, source: number, dest: number): boolean {
    if (source === dest) { return true; }

    const getObservableIdStmt = this.db.prepare('SELECT id FROM observables WHERE url = @url');
    const oid = getObservableIdStmt.get({ url }).id;
    // If indexes adjacent, only swap needed
    if (Math.abs(source - dest) === 1) {
      const swapPrior = this.db.prepare('UPDATE observablePlugins SET priority = CASE \
            WHEN priority = @source THEN @dest \
            WHEN priority = @dest THEN @source \
        END \
            WHERE observable = @oid AND (priority = @source OR priority = @dest)');

      swapPrior.run({ oid, source, dest });

      return true;
    }

    const [lo, hi] = source < dest ? [source, dest] : [dest, source];
    const offset = source < dest ? -1 : +1;
    const stmt = this.db.prepare('UPDATE observablePlugins SET priority = CASE \
            WHEN priority = @source THEN @dest \
            ELSE priority + @offset \
        END \
            WHERE observable = @oid AND priority BETWEEN @lo AND @hi \
        ');

    stmt.run({ oid, source, dest, lo, hi, offset });

    return true;
  }

  public FetchObservables(): Stream[] {
    const observables: Map<string, Stream> = new Map();
    const observablesPluginsStmt = this.db.prepare('SELECT o.url as url, p.name as plugin, o.lastSeen as lastSeen, o.download as download, o.valid as valid \
        FROM observablePlugins op \
        LEFT JOIN plugins p ON op.plugin = p.id \
        LEFT JOIN observables o ON op.observable = o.id \
        WHERE removed=0 \
        ORDER BY o.url, op.priority');
    const observablesPlugins = observablesPluginsStmt.all();

    observablesPlugins.forEach((x: StreamRecord) => {
      const obs = observables.get(x.url);

      if (obs) {
        obs.plugins.push(x.plugin);
      } else {
        observables.set(x.url, { url: x.url, lastSeen: x.lastSeen, download: x.download, valid: !!x.valid, plugins: [x.plugin] });
      }
    });

    return [...observables.values()];
  }

  public UpdateObservableDownload(url: string, download: number): number {
    let ret = -1;
    const transaction = this.db.transaction(() => {
      const updated = this.db.prepare('UPDATE observables SET download = download + @download WHERE url = @url')
        .run({ url, download })
        .changes > 0;

      if (updated) {
        const resp = this.db.prepare('SELECT download FROM observables WHERE url = @url').get({ url });

        if (resp) {
          ret = resp.download;
        }
      }
    });

    this.CallTrasnaction(transaction);

    return ret;
  }

  public FetchPlugins(): PluginRecord[] {
    const pluginsStmt = this.db.prepare('SELECT id, name, enabled FROM plugins ORDER BY priority');
    return pluginsStmt.all()
      .map(x => ({ ...x, enabled: !!x.enabled }));
  }

  public UpdateObservablePlugins(url: string, plugins: Plugin[]): boolean {
    const transaction = this.db.transaction(() => {
      const o = this.db.prepare('SELECT id FROM observables WHERE url=@url').get({ url });
      if (o === undefined) {
        this.CancelTransaction(`Unknown url '${url}' in SqliteAdapter::UpdateObservablePlugins`);
      }

      this.db.prepare('DELETE FROM observablePlugins WHERE observable=@id').run({ id: o.id });

      const addObservablePluginStmt = this.db.prepare('INSERT INTO observablePlugins (observable, plugin, priority) \
                                                         VALUES(@observableId, @plugin, @priority)');

      plugins.forEach((x, priority) => addObservablePluginStmt.run({ observableId: o.id, plugin: x.id, priority }));
    });

    return this.CallTrasnaction(transaction);
  }

  public FetchArchiveRecords(): ArchiveRecord[] {
    const archiveStmt = this.db.prepare('SELECT title, source, timestamp, duration, size, re_encoded as reencoded, filename FROM archive');
    return archiveStmt.all()
      .map(x => ({ ...x, reencoded: !!x.reencoded, locked: false, tags: new Set<string>() }));
  }

  public FetchPlaylists(): Playlist[] {
    const playlistsMap = new Map<number, PlaylistSegmentSerialized[]>();
    this.db.prepare<PlaylistSegmentSerialized[]>('SELECT playlist, \'order\', a.filename as filename, begin, end, loop FROM playlistSegments seg \
                                                                LEFT JOIN archive a ON seg.record = a.id')
      .all()
      .forEach(x => {
        const p = playlistsMap.get(x.playlist);
        if (p) { p.push(x); } else { playlistsMap.set(x.playlist, [x]); }
      });

    playlistsMap.forEach(x => x.sort((l, r) => l.order < r.order ? -1 : 1));

    return this.db.prepare<PlaylistSerialized[]>('SELECT id, title, timestamp FROM playlist')
      .all()
      .map(x => ({
        id: x.id,
        title: x.name,
        timestamp: x.timestamp,
        segments: (playlistsMap.get(x.id) as PlaylistSegmentSerialized[]).map(x =>
          ({ filename: x.filename, begin: x.begin, end: x.end, loop: x.loop }))
      }));
  }

  public AddPlaylist(playlist: Playlist): number {
    let id = -1;
    if (playlist.segments.length === 0) { return id; }

    const addPlaylistStmt = this.db.prepare('INSERT INTO playlist (title, timestamp) VALUES (@title, @timestamp)');
    const addSegment = this.db.prepare('INSERT INTO playlistSegments (playlist, \'order\', record, begin, end, loop) VALUES \
                                            (@playlist, @order, (SELECT id FROM archive WHERE filename = @filename), @begin, @end, @loop)');

    const AddPlaylistTransaction = this.db.transaction((p: Playlist) => {
      id = addPlaylistStmt.run({ title: playlist.title, timestamp: playlist.timestamp }).lastInsertRowid as number;

      playlist.segments.forEach((x, idx) => addSegment.run({ playlist: id, order: idx, filename: x.filename, begin: x.begin, end: x.end, loop: x.loop }));
    });

    return this.CallTrasnaction(AddPlaylistTransaction, playlist) ? id : -1;
  }

  public RemovePlaylist(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM playlist WHERE id=@id');

    return stmt.run({ id }).changes > 0;
  }

  public AddArchiveRecord(record: ArchiveRecord): boolean {
    const stmt = this.db.prepare('INSERT INTO archive (title, source, timestamp, duration, size, re_encoded, filename) \
        VALUES (@title, @source, @timestamp, @duration, @size, @reencoded, @filename)');
    stmt.run({ ...record, reencoded: +record.reencoded });
    return true;
  }

  public RemoveArchiveRecord(filename: string): boolean {
    const stmt = this.db.prepare('DELETE FROM archive WHERE filename=@filename');
    stmt.run({ filename });
    return true;
  }

  /**
     * Returns tag id. Creates one, if not exists.
     * @param tag tag name
     */
  public TagId(tag: string): number {
    const getTagId = this.db.prepare('SELECT id FROM tags WHERE text = @tag');
    const createTag = this.db.prepare('INSERT INTO tags (text) VALUES (@tag)');

    let tid = -1;
    const fetchTagId = this.db.transaction(() => {
      const existingTag = getTagId.get({ tag });
      tid = existingTag ? existingTag.id : createTag.run({ tag }).lastInsertRowid;
    });

    const BreakExecution = () => this.CancelTransaction('Cant fetch tag id');
    this.CallTrasnaction(fetchTagId) || BreakExecution();
    return tid;
  }

  /**
     * Returns record id. Otherwise -1 is returned.
     * @param filename filename
     */
  public ArchiveRecordId(filename: string): number {
    const getRecordIdStmt = this.db.prepare('SELECT id FROM archive WHERE filename = @filename');
    const record = getRecordIdStmt.get({ filename });
    return record ? record.id : -1;
  }

  public AttachTagToArchiveRecord(filename: string, tag: string): boolean {
    const addTagToRecordStmt = this.db.prepare('INSERT INTO archiveTags (record, tag) VALUES (@rid, @tid)');

    const addTagToArchiveRecordQuery = this.db.transaction(() => {
      const rid = this.ArchiveRecordId(filename);

      if (rid === -1) { this.CancelTransaction(`Record with filename = ${filename} not found`); }

      const tid = this.TagId(tag);

      addTagToRecordStmt.run({ rid, tid });
    });

    return this.CallTrasnaction(addTagToArchiveRecordQuery);
  }

  /**
     * @returns  true if tag was detached.
     * @param filename filename
     * @param tag tage
     */
  public DetachTagFromArchiveRecord(filename: string, tag: string): boolean {
    const rid = this.ArchiveRecordId(filename);
    if (rid === -1) return false;

    const tid = this.TagId(tag);
    if (tid === -1) return false;

    const detachStmt = this.db.prepare('DELETE FROM archiveTags WHERE record = @rid AND tag = @tid');
    return detachStmt.run({ rid, tid }).changes > 0;
  }

  public AddSubscription(subscription: PushSubscription, notification: NotificationType): boolean {
    const addSubStmt = this.db.prepare('INSERT INTO subscriptions (endpoint, auth, p256dh) \
        VALUES (@endpoint, @auth, @p256dh)');
    const addNotifStmt = this.db.prepare('INSERT INTO subscriptionNotifications (endpoint, notification) \
        VALUES (@endpoint, @notification)');

    const addSubscription = this.db.transaction(() => {
      addSubStmt.run({ endpoint: subscription.endpoint, auth: subscription.keys.auth, p256dh: subscription.keys.p256dh });
      addNotifStmt.run({ endpoint: subscription.endpoint, notification });
    });

    const BreakExecution = () => this.CancelTransaction('Can\'t add subsription');
    this.CallTrasnaction(addSubscription) || BreakExecution();

    return true;
  }

  public RemoveSubscription(endpoint: string): boolean {
    const stmt = this.db.prepare('DELETE FROM subscriptions WHERE endpoint=@endpoint');
    stmt.run({ endpoint });
    return true;
  }

  public AddSubscriptionNotification(endpoint: string, notification: NotificationType): boolean {
    const stmt = this.db.prepare('INSERT INTO subscriptionNotifications (endpoint, notification) VALUES (@endpoint, @notification)');
    stmt.run({ endpoint, notification });
    return true;
  }

  public RemoveSubscriptionNotification(endpoint: string, notification: NotificationType): boolean {
    const stmt = this.db.prepare('DELETE FROM subscriptionNotifications WHERE endpoint=@endpoint AND notification=@notification');
    stmt.run({ endpoint, notification });
    return true;
  }

  public FetchSubscriptions(): Map<string, ClientSubscription> {
    const ret = new Map<string, ClientSubscription>();
    const result = this.db
      .prepare('SELECT subscriptions.endpoint, notification, auth, p256dh FROM subscriptionNotifications LEFT JOIN \
                subscriptions ON subscriptions.endpoint = subscriptionNotifications.endpoint')
      .all()
      .forEach(x => {
        const sub = ret.get(x.endpoint);

        if (sub) {
          sub.notifications.push(x.notification);
        } else {
          ret.set(x.endpoint, { push: { endpoint: x.endpoint, keys: { auth: x.auth, p256dh: x.p256dh } }, notifications: [x.notification] });
        }
      });

    return ret;
  }

  public Log(message: string): Sqlite3.RunResult {
    return this.db
      .prepare('INSERT INTO log (message) VALUES (@message)')
      .run({ message });
  }

  public FetchRecentLogs(fromTm: number, limit = -1): LogItem[] {
    const stmt =
            'SELECT CAST(strftime(\'%s\', timestamp) AS INT) as timestamp, message \
             FROM log \
             WHERE timestamp <= datetime(@fromTm, \'unixepoch\') \
             ORDER BY timestamp DESC';
    return limit === -1 ?
      this.db.prepare(stmt).all({ fromTm }) :
      this.db.prepare(stmt + ' LIMIT @limit').all({ fromTm, limit });
  }

  public FetchSettings(): Settings {
    return (this.db.prepare('SELECT * FROM settings')
      .all() as SettingsItem[])
      .reduce((o, x) => ({ ...o, [x.property]: JSON.parse(x.value) }),
        { storageQuota: 0, instanceQuota: 0, downloadSpeedQuota: 0, remoteSeleniumUrl: '' });
  }

  public FetchArchiveTags(): Array<{ filename: string, tag: string }> {
    return this.db.prepare('SELECT archive.filename AS filename, tags.text AS tag FROM archiveTags \
        LEFT JOIN archive ON archiveTags.record=archive.id \
        LEFT JOIN tags ON archiveTags.tag=tags.id').all() as Array<{ filename: string, tag: string }>;
  }

  public AddArchiveFilter(name: string, query: string): number {
    return this.db.prepare('INSERT INTO archiveFilter (name, query) VALUES (@name, @query)')
      .run({ name, query }).lastInsertRowid as number;
  }

  public RemoveArchiveFilter(id: number): void {
    this.db.prepare('DELETE FROM archiveFilter WHERE id=@id')
      .run({ id });
  }

  public FetchArchiveFilters(): Filter[] {
    return (this.db.prepare('SELECT * FROM archiveFilter')
      .all() as Filter[]);
  }

  public AddObservablesFilter(name: string, query: string): number {
    return this.db.prepare('INSERT INTO observablesFilter (name, query) VALUES (@name, @query)')
      .run({ name, query }).lastInsertRowid as number;
  }

  public RemoveObservablesFilter(id: number): void {
    this.db.prepare('DELETE FROM observablesFilter WHERE id=@id')
      .run({ id });
  }

  public FetchObservablesFilters(): Filter[] {
    return (this.db.prepare('SELECT * FROM observablesFilter')
      .all() as Filter[]);
  }

  public UpdateSettingProperty<V>(property: string, value: V): void {
    this.db.prepare('UPDATE settings SET value = @value WHERE property = @property')
      .run({ property, value: JSON.stringify(value) });
  }

  public CancelTransaction(reason: string): void {
    throw new Error(reason);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public CallTrasnaction<T extends any[]>(fn: (...args: T) => void, ...args: T): boolean {
    try {
      fn(...args);
    } catch (e) {
      console.error(`Transaction error: ${e}`);
      return false;
    }
    return true;
  }
}
