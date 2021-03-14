import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigatewayv2';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { HttpJwtAuthorizer } from '@aws-cdk/aws-apigatewayv2-authorizers';
import { UserPool, UserPoolClient } from '@aws-cdk/aws-cognito';


export interface BackendCdkStackProps extends cdk.StackProps {
  userPool: UserPool;
  userPoolClient: UserPoolClient;
}
export class BackendCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: BackendCdkStackProps) {
    super(scope, id, props);

    const db = new dynamodb.Table(this, 'dbtable', {
      tableName: 'Rides',
      partitionKey: {
        name: 'RideId',
        type: dynamodb.AttributeType.STRING
      }
    });

    const lambdaRole = new iam.Role(this, 'lambda-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
    });

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:Scan'
      ],
      resources: [ db.tableArn ]
    }));
      
    const reqUnicornLambda = new lambda.Function(this, 'reqUnicorns', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./lib/lambdas/req-unicorn'),
      role: lambdaRole
    });

    const corsLambda = new lambda.Function(this, 'corsLambda', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./lib/lambdas/cors'),
    });

    const api = new apigw.HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowMethods: [ apigw.HttpMethod.POST, apigw.HttpMethod.OPTIONS ],
        allowOrigins: ['*'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ]
      }
    }); 

    const authorizer = new HttpJwtAuthorizer({
      jwtIssuer: props.userPool.userPoolProviderUrl,
      jwtAudience: [ props.userPoolClient.userPoolClientId ]
    });
 
    api.addRoutes({
      path: '/ride',
      methods: [ apigw.HttpMethod.POST],
      authorizer,
      integration: new LambdaProxyIntegration({
        handler: reqUnicornLambda
      }),
    });
    api.addRoutes({
      path: '/ride',
      methods: [ apigw.HttpMethod.OPTIONS],
      integration: new LambdaProxyIntegration({
        handler: corsLambda
      }),
    });

    

    new s3.Bucket(this,'profiles-pics-bucket');

    new cdk.CfnOutput(this, 'api-endpoint-output', {
      exportName: `${this.stackName}-apiEndpoint`,
      value: api.apiEndpoint,
      description: 'API endpoint URL'
    });

  }
}
