// path/to/database/mongoDatabaseDriver.ts
import { MongoClient, Db } from 'mongodb';
import { IDatabaseDriver } from './databaseDriverInterface';
import { injectable } from 'inversify';

@injectable()
export class MongoDatabaseDriver implements IDatabaseDriver {
    private client: MongoClient;
    private dbName: string;

    constructor(uri: string, dbName: string) {
        this.client = new MongoClient(uri);
        this.dbName = dbName;
    }

    async connect(): Promise<void> {
        await this.client.connect();
    }

    getDb(): Db {
        return this.client.db(this.dbName);
    }

    async close(): Promise<void> {
        await this.client.close();
    }
}