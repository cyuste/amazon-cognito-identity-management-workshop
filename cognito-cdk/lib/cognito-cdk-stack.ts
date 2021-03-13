import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import { CfnIdentityPool } from '@aws-cdk/aws-cognito';

export class CognitoCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pool = new cognito.UserPool(this, 'myuserpool', {
      userPoolName: 'WildRydes',
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
        phone: true
      },
      standardAttributes: {
        email: {
          required: true
        },
      },
      customAttributes: {
        'genre' : new cognito.StringAttribute({ minLen: 1, maxLen: 256, mutable: true }),
      }
    });

    const client = pool.addClient('wildrydes-web-app', {
      idTokenValidity: cdk.Duration.minutes(60),
      accessTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(30),
      generateSecret: false,
      authFlows: {
        userSrp: true,
      },
    });

    const idPool = new CfnIdentityPool(this, 'idPool', {
      identityPoolName: 'wildrydes_identity_pool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: client.userPoolClientId,    // The client ID for the Amazon Cognito user pool.
          providerName: pool.userPoolProviderName
        }
      ]
    });

    new cdk.CfnOutput(this, 'clientId-output', {
      exportName: `${this.stackName}-userPoolId`,
      value: pool.userPoolId,
      description: 'User Pool ID'
    });

    new cdk.CfnOutput(this, 'appclientId-output', {
      exportName: `${this.stackName}-appClientId`,
      value: client.userPoolClientId,
      description: 'App client ID'
    });

    new cdk.CfnOutput(this, 'identityPoolId-output', {
      exportName: `${this.stackName}-identityPoolId`,
      value: idPool.ref,
      description: 'Identity pool ID'
    });
  }
}
