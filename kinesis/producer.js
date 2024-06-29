import AWS from 'aws-sdk';
import fetch from 'node-fetch';

const kinesis = new AWS.Kinesis({ region: 'us-west-2' });
const sns = new AWS.SNS({ region: 'us-west-2' });

export async function getStockData(ticker) {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1m`);
    const data = await response.json();
    return data.chart.result[0].indicators.quote[0];
}

export async function createKinesisStreamIfNotExists(streamName) {
    try {
        await kinesis.describeStream({ StreamName: streamName }).promise();
        console.log(`Using existing stream: ${streamName}`);
    } catch (error) {
        if (error.code === 'ResourceNotFoundException') {
            console.log(`Creating new stream: ${streamName}`);
            await kinesis.createStream({ StreamName: streamName, ShardCount: 1 }).promise();
            await kinesis.waitFor('streamExists', { StreamName: streamName }).promise();
        } else {
            throw error;
        }
    }
}

export function sendToKinesis(streamName, data) {
    const params = {
        Data: JSON.stringify(data),
        PartitionKey: 'partitionkey',
        StreamName: streamName,
    };
    kinesis.putRecord(params, (err, data) => {
        if (err) console.error(err);
        else console.log('Data sent to Kinesis:', data);
    });
}

async function findOrCreateSNSTopic(ticker) {
    const topicName = `stock-topic-${ticker}`;
    
    // Check if the topic already exists
    const { Topics } = await sns.listTopics().promise();
    const existingTopic = Topics.find(topic => topic.TopicArn.includes(topicName));
    
    if (existingTopic) {
        console.log(`Using existing topic: ${existingTopic.TopicArn}`);
        return existingTopic.TopicArn;
    } else {
        console.log(`Creating new topic: ${topicName}`);
        const params = {
            Name: topicName
        };
        const { TopicArn } = await sns.createTopic(params).promise();
        return TopicArn;
    }
}

async function subscribeToSNSTopic(topicArn, email) {
    const params = {
        Protocol: 'email',
        TopicArn: topicArn,
        Endpoint: email
    };
    await sns.subscribe(params).promise();
}

export async function sendStockData(req, res) {
    const { ticker, email } = req.body;
    if (!ticker || !email) {
        return res.status(400).send('Ticker and email are required');
    }

    const stockData = await getStockData(ticker);
    const enrichedData = { ...stockData, email };

    const streamName = `stock-data-stream-${ticker}`;
    try {
        await createKinesisStreamIfNotExists(streamName);
        sendToKinesis(streamName, enrichedData);

        const topicArn = await findOrCreateSNSTopic(ticker);
        await subscribeToSNSTopic(topicArn, email);

        res.send('Stock data sent to Kinesis and email subscribed to SNS topic');
    } catch (error) {
        console.error('Error sending stock data:', error);
        res.status(500).send('Failed to send stock data');
    }
}
