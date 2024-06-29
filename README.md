This project demonstrates a serverless architecture using AWS services to process real-time stock data and send notifications based on computed insights. It leverages AWS Lambda for data processing, Amazon Kinesis for data streaming, Amazon S3 for data storage, and Amazon SNS for notification delivery.

Components
1. Data Ingestion
Kinesis Streams: Streams (stock-data-stream-${ticker}) capture real-time stock data from producers.

2. Data Processing
Lambda Functions: Process uploaded stock data files triggered by S3 events.
S3 Triggers: Invokes Lambda functions upon new stock data uploads to stockDataAnalysis000 S3 bucket.

4. Notification Delivery
SNS Topics: Topics (stock-topic-${ticker}) dynamically created per stock ticker.
Subscribers: Email subscribers receive notifications with computed stock data insights.

6. Data Storage
S3 Bucket: Stores processed stock data files (stock_data/ticker/date.json) for historical analysis and Lambda triggers.
Setup
AWS Configuration:

Set up AWS CLI with credentials or configure AWS SDK with access keys.
Ensure IAM roles and permissions are set for Lambda, S3, Kinesis, and SNS.

Deployment:
Deploy Lambda functions and configure S3 triggers.
Create Kinesis streams for data ingestion.
