import AWS from 'aws-sdk';
import { setIntervalAsync, clearIntervalAsync } from 'set-interval-async/dynamic';

const kinesis = new AWS.Kinesis({ region: 'us-west-2' });
const s3 = new AWS.S3({ region: 'us-west-2' });

function processRecords(records, ticker) {
    records.forEach(record => {
        const data = Buffer.from(record.Data, 'base64').toString('utf-8');
        saveToS3(data, ticker);
    });
}

function saveToS3(data, ticker) {
    const bucketName = 'stockDataAnalysis000';
    const fileName = `stock_data/${ticker}/${new Date().toISOString()}.json`;
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: JSON.stringify(data),
    };
    s3.putObject(params, (err, data) => {
        if (err) console.error(err);
        else console.log(`Data saved to S3 (${ticker}):`, data);
    });
}

async function getRecordsFromKinesis(streamName, ticker) {
    const params = {
        StreamName: streamName,
        ShardIteratorType: 'TRIM_HORIZON',
    };
    const shardIterator = (await kinesis.getShardIterator(params).promise()).ShardIterator;

    const getRecordsParams = {
        ShardIterator: shardIterator,
        Limit: 10,
    };

    setIntervalAsync(async () => {
        const records = await kinesis.getRecords(getRecordsParams).promise();
        if (records.Records.length) {
            processRecords(records.Records, ticker);
            getRecordsParams.ShardIterator = records.NextShardIterator;
        }
    }, 24 * 60 * 60 * 1000); // Poll Kinesis once every 24 hours (24 hours * 60 minutes * 60 seconds * 1000 milliseconds)

    // Initial fetch
    const records = await kinesis.getRecords(getRecordsParams).promise();
    if (records.Records.length) {
        processRecords(records.Records, ticker);
        getRecordsParams.ShardIterator = records.NextShardIterator;
    }
}

//subscribe to multiple streams
const tickers = ['AAPL', 'GOOGL', 'MSFT'];

tickers.forEach(ticker => {
    const streamName = `stock-data-stream-${ticker}`;
    getRecordsFromKinesis(streamName, ticker);
});
