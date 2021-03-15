import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as iam from '@aws-cdk/aws-iam';


export interface IdentityPoolProps {
  userPoolClient: cognito.UserPoolClient;
  userPool: cognito.UserPool;
  identityPoolName?: string;
  allowUnauthenticatedIdentities?: boolean
}

export class IdentityPool extends cdk.Construct {
  public readonly identityPoolId: string;
  private readonly idPool: cognito.CfnIdentityPool;
  public readonly authenticatedRole: iam.Role;
  public readonly unauthenticatedRole: iam.Role;

  constructor(scope: cdk.Construct, id: string, props: IdentityPoolProps) {
    super(scope, id);

    this.idPool = new cognito.CfnIdentityPool(this, 'idPool', {
      identityPoolName: props.identityPoolName,
      allowUnauthenticatedIdentities: props.allowUnauthenticatedIdentities || false,
      cognitoIdentityProviders: [
        {
          clientId: props.userPoolClient.userPoolClientId,   
          providerName: props.userPool.userPoolProviderName
        }
      ]
    });
    this.identityPoolId = this.idPool.ref;

    this.authenticatedRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
          "StringEquals": { "cognito-identity.amazonaws.com:aud": this.identityPoolId },
          "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
      }, "sts:AssumeRoleWithWebIdentity"),
    });
    this.unauthenticatedRole = new iam.Role(this, 'CognitoDefaultUnauthenticatedRole', {
      assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
          "StringEquals": { "cognito-identity.amazonaws.com:aud": this.identityPoolId },
          "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
      }, "sts:AssumeRoleWithWebIdentity"),
    });
    new cognito.CfnIdentityPoolRoleAttachment(this, 'Resource', {
      identityPoolId: this.identityPoolId,
      roles: {
        'authenticated': this.authenticatedRole.roleArn,
        'unauthenticated': this.unauthenticatedRole.roleArn
      },
    });

  }
}