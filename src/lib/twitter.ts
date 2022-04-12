import Twitter from 'twitter';
import 'dotenv/config';

const consumerKey = process.env.TWITTER_CONSUMER_KEY as string;
const consumerSecret = process.env.TWITTER_CONSUMER_SECRET as string;
const accessToken = process.env.TWITTER_ACCESS_TOKEN as string;
const accessSecret = process.env.TWITTER_ACCESS_SECRET as string;

const client = new Twitter({
	consumer_key: consumerKey,
	consumer_secret: consumerSecret,
	access_token_key: accessToken,
	access_token_secret: accessSecret,
});

export { client as twitterClient };
