import { fetch } from 'undici';
import { DateTime } from 'luxon';
import { writeFileSync } from 'fs';
import {
  batchWriteCryptoPrice,
  batchWriteCryptoPricePrediction,
  queryCryptoPrice,
} from './table';
import { CryptoCurrency } from '../../shared/enums/crypto';
import {
  ICryptoCompareResponse,
  ICryptoPricePrediction,
} from '../../shared/interfaces/crypto';
import {
  ISagemakerBody,
  ISagemakerInstance,
} from '../../shared/interfaces/aws';
import {
  CRYPTO_COMPARE_API_QUERY,
  CRYPTO_COMPARE_BASE_URL,
} from '../../shared/constants/crypto';
import { handleDynamoDBBatchWrite } from '../../lib/dynamodb-helper';
import { predictCryptoPrice } from './sagemaker';

export const uploadCryptoPrice = async (currency: CryptoCurrency) => {
  try {
    const result = await searchCryptoPrice(currency);
    const data = (result as any).Data.Data.map(
      (data: ICryptoCompareResponse) => ({
        currency,
        price: (data.open + data.close) / 2,
        timestamp: data.time,
      })
    );
    await handleDynamoDBBatchWrite(data, batchWriteCryptoPrice);
    console.log('Upload Success');
  } catch (err) {
    console.log(err);
  }
};

export const getCryptoTrainingData = async (currency: CryptoCurrency) => {
  try {
    const queryCryptoResult = await queryCryptoPrice(currency);
    const allData = queryCryptoResult?.Items;
    if (!allData) return;
    const dataForTraining = allData.slice(
      allData.length - 500,
      allData.length - 100
    );
    const result = {
      start: DateTime.fromSeconds(Number(dataForTraining[0].Timestamp.N)).toSQL(
        { includeOffset: false }
      ),
      target: dataForTraining.map((item) => Number(item.Price.N)),
    };
    writeFileSync(
      `${process.cwd()}/data/${currency}-train.json`,
      JSON.stringify(result)
    );
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const getCryptoPrediction = async (currency: CryptoCurrency) => {
  try {
    const queryCryptoResult = await queryCryptoPrice(currency);
    const allData = queryCryptoResult?.Items;
    if (!allData) return;
    const dataForPrediction = allData.slice(
      allData.length - 100,
      allData.length
    );
    const sagemakerData: ISagemakerInstance = {
      start: DateTime.fromSeconds(
        Number(dataForPrediction[0].Timestamp.N)
      ).toSQL({ includeOffset: false }),
      target: dataForPrediction.map((item) => Number(item.Price.N)),
    };
    const predictionResult = await predictCryptoPrice(currency, sagemakerData);
    const predictionBody = JSON.parse(
      Buffer.from(predictionResult?.Body || '').toString('utf-8')
    ) as ISagemakerBody;

    const cryptoPricePredictionData: ICryptoPricePrediction[] = [];
    for (let i = 0; i < predictionBody.predictions[0].mean.length; i++) {
      cryptoPricePredictionData.push({
        currency: currency,
        timestamp: DateTime.fromSeconds(
          Number(dataForPrediction[dataForPrediction.length - 1].Timestamp.N)
        )
          .plus({ hours: i + 1 })
          .toSeconds(),
        mean: predictionBody.predictions[0].mean[i],
        lowerQuantile: predictionBody.predictions[0].quantiles['0.1'][i],
        upperQuantile: predictionBody.predictions[0].quantiles['0.9'][i],
      });
    }
    await handleDynamoDBBatchWrite(
      cryptoPricePredictionData,
      batchWriteCryptoPricePrediction
    );
  } catch (err) {
    console.log(err);
  }
};

export const searchCryptoPrice = async (currency: CryptoCurrency) => {
  try {
    const response = await fetch(
      `${CRYPTO_COMPARE_BASE_URL}/histohour?fsym=${currency}&tsym=USD&limit=499&${CRYPTO_COMPARE_API_QUERY}`
    );
    return await response.json();
  } catch (err) {
    console.log(err);
  }
};
