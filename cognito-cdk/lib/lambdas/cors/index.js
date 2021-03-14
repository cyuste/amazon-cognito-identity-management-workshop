const randomBytes = require('crypto').randomBytes;

const AWS = require('aws-sdk');



exports.handler = (event, context, callback) => {

    callback(null, {
        statusCode: 200,
    }).catch((err) => {
        console.error(err);
        errorResponse(err.message, context.awsRequestId, callback)
    });
};

