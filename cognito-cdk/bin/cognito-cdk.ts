#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CognitoCdkStack } from '../lib/cognito-cdk-stack';

const app = new cdk.App();
new CognitoCdkStack(app, 'CognitoCdkStack');
