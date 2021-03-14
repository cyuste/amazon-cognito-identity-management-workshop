#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CognitoCdkStack } from '../lib/cognito-cdk-stack';
import { BackendCdkStack }  from '../lib/backend-cdk-stack';

const app = new cdk.App();
const cognitoStack = new CognitoCdkStack(app, 'CognitoCdkStack');
new BackendCdkStack(app, 'BackendCdkStack', {
  userPool: cognitoStack.userPool,
  userPoolClient: cognitoStack.userPoolClient
});
