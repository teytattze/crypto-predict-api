import { DynamoDBStreamHandler } from 'aws-lambda';
import { DateTime } from 'luxon';
import { detectTweetSentiment } from './sentiment';
import {
  ITweet,
  ITweetResponse,
  ITweetSentiment,
} from '../../shared/interfaces/tweet';
import { handleDynamoDBBatchWrite } from '../../lib/dynamodb-helper';
import { batchWriteTweets, batchWriteTweetsSentiment } from './table';
import { CryptoCurrency } from '../../shared/enums/crypto';
import { twitterClient } from '../../lib/twitter';

export const uploadTweets = async (
  keyword: string,
  currency: CryptoCurrency
) => {
  try {
    const tweets = await searchTweets(keyword);
    const data: ITweet[] = tweets!.statuses.map((status: ITweetResponse) => ({
      id: status.id_str,
      currency: currency,
      text: status.text,
      timestamp: DateTime.fromFormat(
        status.created_at,
        'EEE MMM dd TT ZZZ yyyy'
      ).toMillis(),
    }));
    return await handleDynamoDBBatchWrite(data, batchWriteTweets);
  } catch (err) {
    console.log(err);
  }
};

export const tweetsSentiment: DynamoDBStreamHandler = async (event) => {
  const newTweets: ITweet[] = [];
  event.Records.forEach((record) => {
    if (record.eventName === 'INSERT') {
      const newTweet: ITweet = {
        id: record.dynamodb?.NewImage?.Id.S as string,
        timestamp: record.dynamodb?.NewImage?.Timestamp.N as string,
        currency: record.dynamodb?.NewImage?.Currency.S as string,
        text: record.dynamodb?.NewImage?.Text.S as string,
      };
      newTweets.push(newTweet);
    }
  });

  const promises = newTweets.map((tweet) => detectTweetSentiment(tweet));
  const tweetsSentiment = (await Promise.all(promises)) as ITweetSentiment[];

  await handleDynamoDBBatchWrite(tweetsSentiment, batchWriteTweetsSentiment);
};

export const searchTweets = async (keyword: string) => {
  try {
    const response = await twitterClient.get('search/tweets', {
      q: keyword,
      count: 100,
      lang: 'en',
    });
    return response;
  } catch (err) {
    console.log(err);
  }
};
