import {
  BatchWriteItemCommand,
  BatchWriteItemInput,
  ScanCommand,
  ScanInput,
} from '@aws-sdk/client-dynamodb';
import { CryptoCurrency } from '../../shared/enums/crypto';
import dynamoDBClient from '../../lib/aws/dynamodb';
import { ITweet, ITweetSentiment } from '../../shared/interfaces/tweet';

const TWEET_TABLE_NAME = 'Tweet';
const TWEET_SENTIMENT_TABLE_NAME = 'TweetSentiment';

export const batchWriteTweets = async (data: ITweet[]) => {
  try {
    const input = makeBatchWriteTweetsInput(data);
    const result = await dynamoDBClient.send(new BatchWriteItemCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const batchWriteTweetsSentiment = async (data: ITweetSentiment[]) => {
  try {
    const input = makeBatchWriteTweetsSentimentInput(data);
    const result = await dynamoDBClient.send(new BatchWriteItemCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const scanTweetsSentiment = async (currency: CryptoCurrency) => {
  try {
    const input = makeScanTweetsSentimentInput(currency);
    const result = await dynamoDBClient.send(new ScanCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const makeBatchWriteTweetsInput = (
  data: ITweet[]
): BatchWriteItemInput => {
  return {
    RequestItems: {
      [TWEET_TABLE_NAME]: data.map((obj: ITweet) => ({
        PutRequest: {
          Item: {
            Id: { S: obj.id },
            Timestamp: { N: obj.timestamp.toString() },
            Currency: { S: obj.currency },
            Text: { S: obj.text },
          },
        },
      })),
    },
  };
};

export const makeBatchWriteTweetsSentimentInput = (
  data: ITweetSentiment[]
): BatchWriteItemInput => {
  return {
    RequestItems: {
      [TWEET_SENTIMENT_TABLE_NAME]: data.map((obj: ITweetSentiment) => ({
        PutRequest: {
          Item: {
            Id: { S: obj.id },
            Timestamp: { N: obj.timestamp.toString() },
            Currency: { S: obj.currency },
            Sentiment: { S: obj.sentiment },
            Positive: { N: obj.positive.toString() },
            Negative: { N: obj.negative.toString() },
            Mixed: { N: obj.mixed.toString() },
            Neutral: { N: obj.neutral.toString() },
          },
        },
      })),
    },
  };
};

export const makeScanTweetsSentimentInput = (
  currency: CryptoCurrency
): ScanInput => {
  return {
    TableName: TWEET_SENTIMENT_TABLE_NAME,
    FilterExpression: 'Currency = :currency',
    ExpressionAttributeValues: {
      ':currency': { S: currency },
    },
  };
};
