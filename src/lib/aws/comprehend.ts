import { ComprehendClient } from '@aws-sdk/client-comprehend';

const REGION = 'us-east-1';

const client = new ComprehendClient({
	region: REGION,
});

export default client;
