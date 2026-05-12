import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import {
  AccountRecovery,
  CfnUserPoolGroup,
  StringAttribute,
  UserPool,
  UserPoolClient,
} from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { name } from './naming';
import * as path from 'path';

interface AuthStackProps extends StackProps {
  env_name: string;
  table: Table;
}

export class AuthStack extends Stack {
  public readonly userPool: UserPool;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { env_name, table } = props;

    const preSignUp = new NodejsFunction(this, 'PreSignUpFn', {
      functionName: name(env_name, 'fn', 'pre-signup'),
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '..', 'functions', 'auth', 'pre-signup.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        format: undefined,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    const postConfirmation = new NodejsFunction(this, 'PostConfirmationFn', {
      functionName: name(env_name, 'fn', 'post-confirmation'),
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '..', 'functions', 'auth', 'post-confirmation.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        format: undefined,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });

    table.grantReadData(preSignUp);
    table.grantReadWriteData(postConfirmation);

    this.userPool = new UserPool(this, 'UserPool', {
      userPoolName: name(env_name, 'userpool', 'main'),
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true },
      },
      customAttributes: {
        role: new StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      mfa: undefined,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      lambdaTriggers: {
        preSignUp,
        postConfirmation,
      },
    });

    postConfirmation.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['cognito-idp:AdminAddUserToGroup'],
        resources: [`arn:aws:cognito-idp:${this.region}:${this.account}:userpool/*`],
      }),
    );

    new CfnUserPoolGroup(this, 'OwnerGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'wallet_owner',
      precedence: 1,
      description: 'App owner and administrator',
    });

    new CfnUserPoolGroup(this, 'MemberGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'wallet_member',
      precedence: 10,
      description: 'Regular user',
    });

    new CfnUserPoolGroup(this, 'ViewerGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'wallet_viewer',
      precedence: 20,
      description: 'Read-only access',
    });

    new UserPoolClient(this, 'SpaClient', {
      userPoolClientName: name(env_name, 'appclient', 'spa'),
      userPool: this.userPool,
      generateSecret: false,
      authFlows: {
        userSrp: true,
      },
      refreshTokenValidity: Duration.days(30),
      idTokenValidity: Duration.hours(1),
      accessTokenValidity: Duration.hours(1),
      readAttributes: undefined,
      writeAttributes: undefined,
      supportedIdentityProviders: undefined,
    });
  }
}
