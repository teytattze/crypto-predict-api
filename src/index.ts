import { getCryptoPrediction } from './modules/crypto/handler';
import { CryptoCurrency } from './shared/enums/crypto';

(async () => await getCryptoPrediction(CryptoCurrency.SOL))();
