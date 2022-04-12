import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const REGION = 'us-east-1';

const client = new DynamoDBClient({
	region: REGION,
});

export default client;
