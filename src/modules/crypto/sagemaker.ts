import {
  InvokeEndpointCommand,
  InvokeEndpointCommandInput,
} from '@aws-sdk/client-sagemaker-runtime';
import { CryptoCurrency } from '../../shared/enums/crypto';
import { awsSagemaker } from '../../lib/aws';
import { ISagemakerInstance } from '../../shared/interfaces/aws';

export const predictCryptoPrice = async (
  currency: CryptoCurrency,
  data: ISagemakerInstance
) => {
  try {
    const endpointName = sagemakerEndpoint[currency];
    const input = makeSagemakerEnpointInput(endpointName, data);
    const result = await awsSagemaker.send(new InvokeEndpointCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const makeSagemakerEnpointInput = (
  name: string,
  data: ISagemakerInstance
): InvokeEndpointCommandInput => {
  return {
    EndpointName: name,
    Body: JSON.stringify({
      instances: [data],
      configuration: {
        num_samples: 50,
        output_types: ['mean', 'quantiles', 'samples'],
        quantiles: ['0.1', '0.9'],
      },
    }) as any,
    ContentType: 'application/json',
    Accept: 'application/json',
  };
};

const sagemakerEndpoint: Record<keyof typeof CryptoCurrency, string> = {
  BTC: 'BtcPricePredictionEndpoint',
  ETH: 'EthPricePredictionEndpoint',
  SOL: 'SolPricePredictionEndpoint',
  LUNA: 'LunaPricePredictionEndpoint',
  BNB: 'BnbPricePredictionEndpoint',
};
