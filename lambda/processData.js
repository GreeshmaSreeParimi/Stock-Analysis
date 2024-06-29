import AWS from 'aws-sdk';

const s3 = new AWS.S3({ region: 'us-west-2' });
const sns = new AWS.SNS({ region: 'us-west-2' });

exports.handler = async (event) => {
    const bucketName = 'stockDataAnalysis000';
    const key = event.Records[0].s3.object.key;

    // Extract ticker from the S3 key
    const ticker = extractTickerFromKey(key);

    const obj = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
    const data = JSON.parse(obj.Body.toString('utf-8'));

    // Calculate average closing price
    const closingPrices = data.close;
    const avgClosingPrice = closingPrices.reduce((a, b) => a + b, 0) / closingPrices.length;

    const message = `Average closing price for ${ticker}: ${avgClosingPrice}`;
    console.log(message);

    // Send notification to corresponding SNS topic
    const topicArn = `stock-topic-${ticker}`;
    const snsParams = {
        Message: message,
        Subject: 'Stock Data Analysis',
        TopicArn: topicArn,
    };
    await sns.publish(snsParams).promise();

    return {
        statusCode: 200,
        body: JSON.stringify('Data processed and notification sent'),
    };
};

function extractTickerFromKey(key) {
    // Example key format: stock_data/AAPL/2024-06-30T12:00:00Z.json
    const parts = key.split('/');
    return parts[1]; // ticker is the second part of the key
}
