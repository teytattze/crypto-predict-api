import {
  BatchWriteItemCommand,
  BatchWriteItemInput,
  QueryCommand,
  QueryInput,
} from '@aws-sdk/client-dynamodb';
import { CryptoCurrency } from '../../shared/enums/crypto';
import { awsDynamodb } from '../../lib/aws';
import {
  ICryptoPrice,
  ICryptoPricePrediction,
} from '../../shared/interfaces/crypto';

const CRYPTO_PRICE_TABLE_NAME = 'CryptoPrice';
const CRYPTO_PRICE_PREDICTION_TABLE_NAME = 'CryptoPricePrediction';

export const queryCryptoPrice = async (currency: CryptoCurrency) => {
  try {
    const input = makeQueryCryptoPriceInput(currency);
    const result = await awsDynamodb.send(new QueryCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const queryCryptoPricePrediction = async (currency: CryptoCurrency) => {
  try {
    const input = makeQueryCryptoPricePredictionInput(currency);
    const result = await awsDynamodb.send(new QueryCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const batchWriteCryptoPrice = async (data: ICryptoPrice[]) => {
  try {
    const input = makeBatchWriteCryptoPriceInput(data);
    const result = await awsDynamodb.send(new BatchWriteItemCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const batchWriteCryptoPricePrediction = async (
  data: ICryptoPricePrediction[]
) => {
  try {
    const input = makeBatchWriteCryptoPricePredictionInput(data);
    const result = await awsDynamodb.send(new BatchWriteItemCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const makeQueryCryptoPriceInput = (
  currency: CryptoCurrency
): QueryInput => {
  return {
    TableName: CRYPTO_PRICE_TABLE_NAME,
    KeyConditionExpression: 'Currency = :currency',
    ExpressionAttributeValues: {
      ':currency': { S: currency },
    },
  };
};

export const makeQueryCryptoPricePredictionInput = (
  currency: CryptoCurrency
): QueryInput => {
  return {
    TableName: CRYPTO_PRICE_PREDICTION_TABLE_NAME,
    KeyConditionExpression: 'Currency = :currency',
    ExpressionAttributeValues: {
      ':currency': { S: currency },
    },
  };
};

export const makeBatchWriteCryptoPriceInput = (
  data: ICryptoPrice[]
): BatchWriteItemInput => {
  return {
    RequestItems: {
      [CRYPTO_PRICE_TABLE_NAME]: data.map((obj: ICryptoPrice) => ({
        PutRequest: {
          Item: {
            Currency: { S: obj.currency as string },
            Price: { N: obj.price.toString() },
            Timestamp: { N: obj.timestamp.toString() },
          },
        },
      })),
    },
  };
};

export const makeBatchWriteCryptoPricePredictionInput = (
  data: ICryptoPricePrediction[]
): BatchWriteItemInput => {
  return {
    RequestItems: {
      [CRYPTO_PRICE_PREDICTION_TABLE_NAME]: data.map(
        (obj: ICryptoPricePrediction) => ({
          PutRequest: {
            Item: {
              Currency: { S: obj.currency },
              Timestamp: { N: obj.timestamp.toString() },
              Mean: { N: obj.mean.toString() },
              LowerQuantile: { N: obj.lowerQuantile.toString() },
              UpperQuantile: { N: obj.upperQuantile.toString() },
            },
          },
        })
      ),
    },
  };
};
