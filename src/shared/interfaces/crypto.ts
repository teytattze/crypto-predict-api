import { CryptoCurrency } from '../enums/crypto';

export interface ICryptoCompareResponse {
  time: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volumefrom: number;
  volumeto: number;
  conversionType: string;
  conversionSymbol: string;
}

export interface ICryptoPrice {
  currency: string;
  timestamp: number;
  price: number;
}

export interface ICryptoPricePrediction {
  currency: CryptoCurrency;
  timestamp: number;
  mean: number;
  upperQuantile: number;
  lowerQuantile: number;
}
