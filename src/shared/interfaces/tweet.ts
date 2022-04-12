export interface ITweetResponse {
	id: number;
	id_str: string;
	text: string;
	created_at: string;
	[key: string]: any;
}

export interface ITweet {
	id: string;
	currency: string;
	text: string;
	timestamp: string;
}

export interface ITweetSentiment {
	id: string;
	currency: string;
	timestamp: string;
	sentiment: string;
	positive: number;
	negative: number;
	mixed: number;
	neutral: number;
}
