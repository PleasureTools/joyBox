import * as sqlite3 from 'better-sqlite3';
import { PushSubscription } from 'web-push';

import { LogItem } from '@Shared/Types';
import { ArchiveRecord, ObservableStream } from '../Common/Types';

interface StreamRecord {
    url: string;
    lastSeen: number;
    plugin: string;
}

interface Stream {
    url: string;
    lastSeen: number;
    plugins: string[];
}

interface PluginRecord {
    id: number;
    name: string;
    enabled: boolean;
}

export class SqliteAdapter {
    constructor(private db: sqlite3.Database) { }

    public Initialize(plugins: string[]) {
        this.db
            .exec('CREATE TABLE IF NOT EXISTS observables (\
                id INTEGER PRIMARY KEY, \
                 url TEXT UNIQUE COLLATE NOCASE, \
                 lastSeen INTEGER DEFAULT -1 \
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
            .exec('BEGIN; \
            CREATE TABLE IF NOT EXISTS log (\
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, \
                message TEXT ); \
                CREATE INDEX log_timestamp ON log (timestamp);\
                COMMIT;');

        /* this.AddArchiveRecord({ title: '', source: '', timestamp: 0, duration: 0, filename: 'boobs.mp4' });
        this.AddArchiveRecord({ title: '', source: '', timestamp: 0, duration: 0, filename: 'ass.mp4' });

        console.log(this.AttachTagToArchiveRecord('boobs.mp4', 'boobs'));
        console.log(this.AttachTagToArchiveRecord('boobs.mp4', 'tits'));

        console.log(this.AttachTagToArchiveRecord('ass.mp4', 'ass'));
        console.log(this.AttachTagToArchiveRecord('ass.mp4', 'boobs'));

        this.DetachTagFromArchiveRecord('boobs.mp4', 'tits'); */

        const addPluginStmt = this.db.prepare(
            'INSERT INTO plugins (name, enabled, priority) VALUES (@name, true, @priority)'
        );

        for (let priority = 0; priority < plugins.length; ++priority) {
            addPluginStmt.run({ name: plugins[priority], priority });
        }
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

    public UpdateLastSeen(url: string, lastSeen = Date.now()) {
        return this.db.prepare('UPDATE observables SET lastSeen = @lastSeen WHERE url = @url')
            .run({ url, lastSeen })
            .changes > 0;
    }

    public RemoveObservable(url: string): boolean {
        const removeObservableStmt = this.db.prepare('DELETE FROM observables WHERE url = @url');
        removeObservableStmt.run({ url });
        return true;
    }

    public ReorderPlugin(source: number, dest: number) {
        if (source === dest)
            return;

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

    public ReorderObservablePlugin(url: string, source: number, dest: number) {
        if (source === dest)
            return;

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
            WHERE observale = @oid AND priority BETWEEN @lo AND @hi \
        ');

        stmt.run({ oid, source, dest, lo, hi, offset });

        return true;
    }

    public FetchObservables(): Stream[] {
        const observables: Map<string, Stream> = new Map();
        const observablesPluginsStmt = this.db.prepare('SELECT o.url as url, p.name as plugin, o.lastSeen as lastSeen \
        FROM observablePlugins op \
        LEFT JOIN plugins p ON op.plugin = p.id \
        LEFT JOIN observables o ON op.observable = o.id \
        ORDER BY o.url, op.priority');
        const observablesPlugins = observablesPluginsStmt.all();

        observablesPlugins.forEach((x: StreamRecord) => {
            const obs = observables.get(x.url);

            if (obs) {
                obs.plugins.push(x.plugin);
            } else {
                observables.set(x.url, { url: x.url, lastSeen: x.lastSeen, plugins: [x.plugin] });
            }
        });

        return [...observables.values()];
    }

    public FetchPlugins(): PluginRecord[] {
        const pluginsStmt = this.db.prepare('SELECT id, name, enabled FROM plugins ORDER BY priority');
        return pluginsStmt.all()
            .map(x => ({ ...x, enabled: !!x.enabled }));
    }

    public FetchArchiveRecords(): ArchiveRecord[] {
        const archiveStmt = this.db.prepare('SELECT * FROM archive');
        return archiveStmt.all();
    }

    public AddArchiveRecord(record: ArchiveRecord): boolean {
        const stmt = this.db.prepare('INSERT INTO archive (title, source, timestamp, duration, size, filename) \
        VALUES (@title, @source, @timestamp, @duration, @size, @filename)');
        stmt.run(record);
        return true;
    }

    public RemoveArchiveRecord(filename: string) {
        const stmt = this.db.prepare('DELETE FROM archive WHERE filename=@filename');
        stmt.run({ filename });
        return true;
    }

    /**
     * Returns tag id. Creates one, if not exists.
     * @param tag tag name
     */
    public TagId(tag: string) {
        const getTagId = this.db.prepare('SELECT id FROM tags WHERE text = @tag');
        const createTag = this.db.prepare('INSERT INTO tags (text) VALUES (@tag)');

        let tid = -1;
        const fetchTagId = this.db.transaction(() => {
            const existingTag = getTagId.get({ tag });
            tid = existingTag && existingTag.id || createTag.run({ tag }).lastInsertRowid;
        });

        const BreakExecution = () => this.CancelTransaction('Cant fetch tag id');
        this.CallTrasnaction(fetchTagId) || BreakExecution();
        return tid;
    }

    /**
     * Returns record id. Otherwise -1 is returned.
     * @param filename filename
     */
    public ArchiveRecordId(filename: string) {
        const getRecordIdStmt = this.db.prepare('SELECT id FROM archive WHERE filename = @filename');
        const record = getRecordIdStmt.get({ filename });
        return record && record.id || -1;
    }

    public AttachTagToArchiveRecord(filename: string, tag: string): boolean {
        const addTagToRecordStmt = this.db.prepare('INSERT INTO archiveTags (record, tag) VALUES (@rid, @tid)');

        const addTagToArchiveRecordQuery = this.db.transaction(() => {
            const rid = this.ArchiveRecordId(filename);

            if (rid === -1)
                this.CancelTransaction(`Record with filename = ${filename} not found`);

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

    public AddSubscription(subscription: PushSubscription) {
        const stmt = this.db.prepare('INSERT INTO subscriptions (endpoint, auth, p256dh) \
         VALUES (@endpoint, @auth, @p256dh)');
        stmt.run({ endpoint: subscription.endpoint, auth: subscription.keys.auth, p256dh: subscription.keys.p256dh });
        return true;
    }

    public RemoveSubscription(endpoint: string) {
        const stmt = this.db.prepare('DELETE FROM subscriptions WHERE endpoint=@endpoint');
        stmt.run({ endpoint });
        return true;
    }

    public FetchSubscriptions(): PushSubscription[] {
        return this.db
            .prepare('SELECT endpoint, auth, p256dh FROM subscriptions')
            .all()
            .map(x => ({ endpoint: x.endpoint, keys: { auth: x.auth, p256dh: x.p256dh } }));
    }
    public Log(message: string) {
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

    public CancelTransaction(reason: string) {
        throw new Error(reason);
    }

    public CallTrasnaction(fn: (...args: any[]) => void, ...args: any[]): boolean {
        try {
            fn(...args);
        } catch (e) {
            console.error(`Transaction error: ${e}`);
            return false;
        }
        return true;
    }
}
