import { Client } from '@elastic/elasticsearch';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200';

/** The Elasticsearch client. */
const client = new Client({ node: ELASTICSEARCH_URL });

export default client;
