const AWS = require('aws-sdk');
const sns = new AWS.SNS({ region: 'us-west-2' });

function sendNotification(message) {
    const params = {
        Message: message,
        Subject: 'Stock Data Notification',
        TopicArn: 'arn:aws:sns:us-west-2:123456789012:stockAnalysisTopic',
    };
    sns.publish(params, (err, data) => {
        if (err) console.error(err);
        else console.log('Notification sent:', data);
    });
}

sendNotification('Test notification from stock data analysis system');
