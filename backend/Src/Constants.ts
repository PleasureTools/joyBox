import * as path from 'path';

export const DATA_FOLDER = 'data';
export const INCOMPLETE_FOLDER = path.join(DATA_FOLDER, 'incomplete');
export const ARCHIVE_FOLDER = path.join(DATA_FOLDER, 'archive');
export const THUMBNAIL_FOLDER = path.join(ARCHIVE_FOLDER, 'thumbnail');
export const DB_FILENAME = 'db.sqlite3';
export const DB_LOCATION = path.join(DATA_FOLDER, DB_FILENAME);
export const TLS_PRIVATE_KEY = path.join(DATA_FOLDER, 'server.key');
export const TLS_CERTIFICATE = path.join(DATA_FOLDER, 'server.cer');
export const VAPID_CONFIG = path.join(DATA_FOLDER, 'vapid.json');
export const JWT_TTL = 3600;
export const JWT_PROLONGATION_TTL = 900;
