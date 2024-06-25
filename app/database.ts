import pgPromise from 'pg-promise';

class AsyncDatabaseConnection {
    private db: any;
    private connection: any;
    private config: any;

    constructor(config: any) {
        const pgp = pgPromise();
        this.db = pgp;
        this.connection = null;
        this.config = config;
    }

    async connect() {
        this.connection = await this.db(this.config);
        return this.connection;
    }

    async close() {
        await this.connection.$pool.end();
    }
}

export default AsyncDatabaseConnection;
