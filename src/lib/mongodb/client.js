import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';

/** The MongoDB client. */
export const client = new MongoClient(MONGODB_URI, { authSource: 'admin' });

export default () => client.db(process.env.MONGODB_DB ?? 'micala');
