import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  DynamoDBStreamEvent,
  DynamoDBStreamHandler,
} from 'aws-lambda';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  PostToConnectionCommandInput,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { DateTime } from 'luxon';
import {
  deleteWebSocketConnection,
  saveWebSocketConnection,
  scanWebSocketConnections,
} from './table';
import { scanTweetsSentiment } from '../tweet/table';
import { CryptoCurrency } from '../../shared/enums/crypto';
import { queryCryptoPricePrediction, queryCryptoPrice } from '../crypto/table';

const ENDPOINT =
  'https://mgjp55w393.execute-api.us-east-1.amazonaws.com/production';

export const clientConnect: APIGatewayProxyHandler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return { statusCode: 400, body: 'Bad request' };
  await saveWebSocketConnection(connectionId);
  return { statusCode: 200, body: 'Connected successfully' };
};

export const clientDisconnect: APIGatewayProxyHandler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return { statusCode: 400, body: 'Bad request' };
  await deleteWebSocketConnection(connectionId);
  return { statusCode: 200, body: 'Disconnected successfully' };
};

export const clientDefault: APIGatewayProxyHandler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  if (!connectionId) return { statusCode: 400, body: 'Bad request' };
  return { statusCode: 200, body: 'This is the default route' };
};

export const sendCurrencyData: APIGatewayProxyHandler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const result = await getCryptoAndSentimentResult();

    const awsApiGatewayManagementApi = getAwsApiGatewayManagementClient(event);
    const input: PostToConnectionCommandInput = {
      ConnectionId: connectionId,
      Data: JSON.stringify(result) as any,
    };
    await awsApiGatewayManagementApi.send(new PostToConnectionCommand(input));

    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    return { statusCode: 500, body: 'Internal server error' };
  }
};

export const broadcastCurrencyData: DynamoDBStreamHandler = async (event) => {
  try {
    const scanWebSocketConnectionResult = await scanWebSocketConnections();
    const clients = scanWebSocketConnectionResult?.Items;
    if (!clients) return;

    const result = await getCryptoAndSentimentResult();
    const awsApiGatewayManagementApi = getAwsApiGatewayManagementClient(event);
    const promises = clients.map((client) => {
      const input: PostToConnectionCommandInput = {
        ConnectionId: client.Id.S,
        Data: JSON.stringify(result) as any,
      };
      return awsApiGatewayManagementApi.send(
        new PostToConnectionCommand(input)
      );
    });

    await Promise.all(promises);
  } catch (err) {
    console.log(err);
  }
};

const getAwsApiGatewayManagementClient = (
  event: APIGatewayProxyEvent | DynamoDBStreamEvent
) => {
  let endpoint = '';

  if ('requestContext' in event) {
    const domainName = event?.requestContext?.domainName;
    const stage = event?.requestContext?.stage;
    endpoint = 'https://' + domainName + '/' + stage;
  } else {
    endpoint = ENDPOINT;
  }

  return new ApiGatewayManagementApiClient({
    endpoint,
  });
};

const getCryptoAndSentimentResult = async () => {
  const currencies = [
    CryptoCurrency.BNB,
    CryptoCurrency.BTC,
    CryptoCurrency.ETH,
    CryptoCurrency.LUNA,
    CryptoCurrency.SOL,
  ];

  const sentimentPromises = currencies.map((currency) =>
    getSentimentResult(currency)
  );
  const pricePromises = currencies.map((currency) =>
    getCryptoPriceResult(currency)
  );
  const sentimentResult = await Promise.all(sentimentPromises);
  const priceResult = await Promise.all(pricePromises);

  const result = currencies.reduce((acc, item, index) => {
    return {
      ...acc,
      [item]: {
        sentiment: sentimentResult[index],
        price: priceResult[index],
      },
    };
  }, {});

  return result;
};

const getSentimentResult = async (currency: CryptoCurrency) => {
  const scanTweetsSentimentResults = await scanTweetsSentiment(currency);
  const sentimentItems = scanTweetsSentimentResults?.Items;
  if (!sentimentItems) return;
  const result = [
    sentimentItems.slice(0, 100).reduce(
      (acc, item) => {
        acc.values[0] += Number(item.Positive.N);
        acc.values[1] += Number(item.Negative.N);
        acc.values[2] += Number(item.Mixed.N);
        acc.values[3] += Number(item.Neutral.N);
        return acc;
      },
      {
        values: [0, 0, 0, 0],
        labels: ['Positive', 'Negative', 'Mixed', 'Neutral'],
        type: 'pie',
      }
    ),
  ];
  result[0].values = result[0].values.map((value) => value / 100);
  return result;
};

export const getCryptoPriceResult = async (currency: CryptoCurrency) => {
  const queryCryptoPriceResult = await queryCryptoPrice(currency);
  const queryCryptoPricePredictionResult = await queryCryptoPricePrediction(
    currency
  );
  const cryptoPriceItems = queryCryptoPriceResult?.Items;
  const cryptoPricePredictionItems = queryCryptoPricePredictionResult?.Items;
  if (!cryptoPriceItems || !cryptoPricePredictionItems) return;

  const lastestCryptoPriceItems = cryptoPriceItems.slice(
    cryptoPriceItems.length - 100,
    cryptoPriceItems.length
  );

  const result = [
    {
      type: 'scatter',
      mode: 'lines',
      name: 'Original Data',
      x: lastestCryptoPriceItems.map((item) =>
        DateTime.fromSeconds(Number(item.Timestamp.N)).toSQL({
          includeOffset: false,
        })
      ),
      y: lastestCryptoPriceItems.map((item) => Number(item.Price.N)),
      line: { color: '#c62828' },
    },
    {
      type: 'scatter',
      mode: 'lines',
      name: 'Mean',
      x: cryptoPricePredictionItems.map((item) =>
        DateTime.fromSeconds(Number(item.Timestamp.N)).toSQL({
          includeOffset: false,
        })
      ),
      y: cryptoPricePredictionItems.map((item) => Number(item.Mean.N)),
      line: { color: '#43a047' },
    },
    {
      type: 'scatter',
      mode: 'lines',
      name: 'Prediction 0.1 Quantile',
      x: cryptoPricePredictionItems.map((item) =>
        DateTime.fromSeconds(Number(item.Timestamp.N)).toSQL({
          includeOffset: false,
        })
      ),
      y: cryptoPricePredictionItems.map((item) => Number(item.LowerQuantile.N)),
      line: { color: '#7cb342' },
    },
    {
      type: 'scatter',
      mode: 'lines',
      name: 'Prediction 0.9 Quantile',
      x: cryptoPricePredictionItems.map((item) =>
        DateTime.fromSeconds(Number(item.Timestamp.N)).toSQL({
          includeOffset: false,
        })
      ),
      y: cryptoPricePredictionItems.map((item) => Number(item.UpperQuantile.N)),
      line: { color: '#c0ca33' },
    },
  ];

  return result;
};
