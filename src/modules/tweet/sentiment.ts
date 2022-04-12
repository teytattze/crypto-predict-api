import {
	DetectSentimentCommand,
	DetectSentimentCommandInput,
} from '@aws-sdk/client-comprehend';
import { awsComprehend } from '../../lib/aws';
import { ITweet, ITweetSentiment } from '../../shared/interfaces/tweet';

export const detectTweetSentiment = async (tweet: ITweet) => {
	try {
		const input = makeDetectTweetSentimentInput(tweet);
		const result = await awsComprehend.send(new DetectSentimentCommand(input));
		const tweetSentiment: ITweetSentiment = {
			id: tweet.id,
			currency: tweet.currency,
			timestamp: tweet.timestamp,
			sentiment: result.Sentiment || '',
			positive: result.SentimentScore?.Positive || 0,
			negative: result.SentimentScore?.Negative || 0,
			mixed: result.SentimentScore?.Mixed || 0,
			neutral: result.SentimentScore?.Neutral || 0,
		};
		return tweetSentiment;
	} catch (err) {
		console.log(err);
	}
};

const makeDetectTweetSentimentInput = (
	tweet: ITweet,
): DetectSentimentCommandInput => {
	return {
		LanguageCode: 'en',
		Text: tweet.text,
	};
};
