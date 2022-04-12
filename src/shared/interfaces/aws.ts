export interface ISagemakerBody {
  predictions: {
    mean: number[];
    quantiles: {
      0.1: number[];
      0.9: number[];
    };
    samples: number[][];
  }[];
}

export interface ISagemakerInstance {
  start: string;
  target: number[];
}
