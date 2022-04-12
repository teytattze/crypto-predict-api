import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';
import dynamoDBClient from '../../lib/aws/dynamodb';

const TABLE_NAME = 'WebSocketConnection';

export const saveWebSocketConnection = async (id: string) => {
  try {
    const input = makePutWebSocketConnectionInput(id);
    const result = await dynamoDBClient.send(new PutItemCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const deleteWebSocketConnection = async (id: string) => {
  try {
    const input = makeDeleteWebSocketConnectionInput(id);
    const result = await dynamoDBClient.send(new DeleteItemCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

export const scanWebSocketConnections = async () => {
  try {
    const input = makeScanWebSocketConnectionInput();
    const result = await dynamoDBClient.send(new ScanCommand(input));
    return result;
  } catch (err) {
    console.log(err);
  }
};

const makePutWebSocketConnectionInput = (id: string): PutItemCommandInput => {
  return {
    TableName: TABLE_NAME,
    Item: {
      Id: { S: id },
    },
  };
};

const makeDeleteWebSocketConnectionInput = (
  id: string
): DeleteItemCommandInput => {
  return {
    TableName: TABLE_NAME,
    Key: { Id: { S: id } },
  };
};

const makeScanWebSocketConnectionInput = (): ScanCommandInput => {
  return { TableName: TABLE_NAME };
};
