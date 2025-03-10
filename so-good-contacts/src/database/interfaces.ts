// path/to/database/databaseDriverInterface.ts
import { Db } from 'mongodb';

export interface IDatabaseDriver {
    getDb(): Db;
}