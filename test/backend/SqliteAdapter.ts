import * as Sqlite3 from 'better-sqlite3';
import * as chai from 'chai';
import * as mocha from 'mocha';

import { SqliteAdapter } from './../../backend/Src/Services/SqliteAdapter';

describe('SqliteAdapter', () => {
    describe('ReorderPlugin', () => {
        it('Move to same index', () => {
            const db = new Sqlite3('ReorderPlugin.msn.sqlite3', { memory: true});
            const adapter = new SqliteAdapter(db);

            adapter.Initialize(['plugin1', 'plugin2', 'plugin3', 'plugin4', 'plugin5', 'plugin6']);
            adapter.ReorderPlugin(3, 3);

            const stmt = db.prepare('SELECT * FROM plugins');

            chai.expect(stmt.all()).to.deep.equal([
                { id: 1, name: 'plugin1', enabled: 1, priority: 0 },
                { id: 2, name: 'plugin2', enabled: 1, priority: 1 },
                { id: 3, name: 'plugin3', enabled: 1, priority: 2 },
                { id: 4, name: 'plugin4', enabled: 1, priority: 3 },
                { id: 5, name: 'plugin5', enabled: 1, priority: 4 },
                { id: 6, name: 'plugin6', enabled: 1, priority: 5 }
            ]);
        });

        it('Move element down with elements between', () => {
            const db = new Sqlite3('ReorderPlugin.muf.sqlite3', { memory: true});
            const adapter = new SqliteAdapter(db);

            adapter.Initialize(['plugin1', 'plugin2', 'plugin3', 'plugin4', 'plugin5', 'plugin6']);
            adapter.ReorderPlugin(1, 4);

            const stmt = db.prepare('SELECT * FROM plugins');

            chai.expect(stmt.all()).to.deep.equal([
                { id: 1, name: 'plugin1', enabled: 1, priority: 0 },
                { id: 2, name: 'plugin2', enabled: 1, priority: 4 },
                { id: 3, name: 'plugin3', enabled: 1, priority: 1 },
                { id: 4, name: 'plugin4', enabled: 1, priority: 2 },
                { id: 5, name: 'plugin5', enabled: 1, priority: 3 },
                { id: 6, name: 'plugin6', enabled: 1, priority: 5 }
            ]);
        });

        it('Move element up with elements between', () => {
            const db = new Sqlite3('ReorderPlugin.mdf.sqlite3', { memory: true});
            const adapter = new SqliteAdapter(db);

            adapter.Initialize(['plugin1', 'plugin2', 'plugin3', 'plugin4', 'plugin5', 'plugin6']);
            adapter.ReorderPlugin(4, 1);

            const stmt = db.prepare('SELECT * FROM plugins');

            chai.expect(stmt.all()).to.deep.equal([
                { id: 1, name: 'plugin1', enabled: 1, priority: 0 },
                { id: 2, name: 'plugin2', enabled: 1, priority: 2 },
                { id: 3, name: 'plugin3', enabled: 1, priority: 3 },
                { id: 4, name: 'plugin4', enabled: 1, priority: 4 },
                { id: 5, name: 'plugin5', enabled: 1, priority: 1 },
                { id: 6, name: 'plugin6', enabled: 1, priority: 5 }
            ]);
        });

        it('Move down to neighboring', () => {
            const db = new Sqlite3('ReorderPlugin.mdn.sqlite3', { memory: true});
            const adapter = new SqliteAdapter(db);

            adapter.Initialize(['plugin1', 'plugin2', 'plugin3', 'plugin4', 'plugin5', 'plugin6']);
            adapter.ReorderPlugin(2, 3);

            const stmt = db.prepare('SELECT * FROM plugins');

            chai.expect(stmt.all()).to.deep.equal([
                { id: 1, name: 'plugin1', enabled: 1, priority: 0 },
                { id: 2, name: 'plugin2', enabled: 1, priority: 1 },
                { id: 3, name: 'plugin3', enabled: 1, priority: 3 },
                { id: 4, name: 'plugin4', enabled: 1, priority: 2 },
                { id: 5, name: 'plugin5', enabled: 1, priority: 4 },
                { id: 6, name: 'plugin6', enabled: 1, priority: 5 }
            ]);
        });

        it('Move up to neighboring', () => {
            const db = new Sqlite3('ReorderPlugin.mun.sqlite3', { memory: true});
            const adapter = new SqliteAdapter(db);

            adapter.Initialize(['plugin1', 'plugin2', 'plugin3', 'plugin4', 'plugin5', 'plugin6']);
            adapter.ReorderPlugin(3, 2);

            const stmt = db.prepare('SELECT * FROM plugins');

            chai.expect(stmt.all()).to.deep.equal([
                { id: 1, name: 'plugin1', enabled: 1, priority: 0 },
                { id: 2, name: 'plugin2', enabled: 1, priority: 1 },
                { id: 3, name: 'plugin3', enabled: 1, priority: 3 },
                { id: 4, name: 'plugin4', enabled: 1, priority: 2 },
                { id: 5, name: 'plugin5', enabled: 1, priority: 4 },
                { id: 6, name: 'plugin6', enabled: 1, priority: 5 }
            ]);
        });
    });
});
