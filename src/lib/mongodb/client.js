import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/micala';

/** The MongoDB client. */
const client = new MongoClient(MONGODB_URI, { authSource: 'admin' });

export default client;
