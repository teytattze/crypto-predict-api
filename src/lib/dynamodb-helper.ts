export const handleDynamoDBBatchWrite = async <T, R extends any>(
  data: T[],
  callback: (data: T[]) => R
) => {
  const count = 25;
  const splitedData = [];
  while (data.length > 0) {
    splitedData.push(data.splice(0, count));
  }
  const promises = splitedData.map((data) => callback(data));
  return await Promise.all(promises);
};
