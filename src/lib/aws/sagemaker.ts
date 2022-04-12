import { SageMakerRuntimeClient } from '@aws-sdk/client-sagemaker-runtime';

const REGION = 'us-east-1';

const client = new SageMakerRuntimeClient({
  region: REGION,
});

export default client;
