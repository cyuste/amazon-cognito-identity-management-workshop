import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as iam from '@aws-cdk/aws-iam';
import { IdentityPool } from './constructs/identity-pool';


export class CognitoCdkStack extends cdk.Stack {
  public userPool: cognito.UserPool;
  public userPoolClient: cognito.UserPoolClient;
  public identityPool: IdentityPool;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'myuserpool', {
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
      },
    });

    this.userPoolClient = this.userPool.addClient('wildrydes-web-app', {
      idTokenValidity: cdk.Duration.minutes(60),
      accessTokenValidity: cdk.Duration.minutes(60),
      refreshTokenValidity: cdk.Duration.days(30),
      generateSecret: false,
      authFlows: {
        userSrp: true,
      },
    });

    this.identityPool = new IdentityPool(this, 'idPool', {
      identityPoolName: 'wildrydes_identity_pool',
      allowUnauthenticatedIdentities: false,
      userPoolClient: this.userPoolClient,    // The client ID for the Amazon Cognito user pool.
      userPool: this.userPool,
    });

    new cdk.CfnOutput(this, 'clientId-output', {
      exportName: `${this.stackName}-userPoolId`,
      value: this.userPool.userPoolId,
      description: 'User Pool ID'
    });

    new cdk.CfnOutput(this, 'appclientId-output', {
      exportName: `${this.stackName}-appClientId`,
      value: this.userPoolClient.userPoolClientId,
      description: 'App client ID'
    });

    new cdk.CfnOutput(this, 'identityPoolId-output', {
      exportName: `${this.stackName}-identityPoolId`,
      value: this.identityPool.identityPoolId,
      description: 'Identity pool ID'
    });
  }
}
