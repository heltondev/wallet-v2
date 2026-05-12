import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  EndpointType,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { bucketName, name } from './naming';
import * as path from 'path';

interface ApiStackProps extends StackProps {
  env_name: string;
  accountId: string;
  table: Table;
  userPool: UserPool;
  allowedOrigins: string[];
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { env_name, accountId, table, userPool, allowedOrigins } = props;

    // Receipts S3 bucket
    const receiptsBucket = new Bucket(this, 'ReceiptsBucket', {
      bucketName: bucketName(env_name, 'receipts', accountId),
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [HttpMethods.PUT, HttpMethods.GET],
          allowedOrigins: allowedOrigins,
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    const api = new RestApi(this, 'Api', {
      restApiName: name(env_name, 'api', 'main'),
      endpointTypes: [EndpointType.REGIONAL],
      deployOptions: {
        throttlingRateLimit: 50,
        throttlingBurstLimit: 100,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoAuth', {
      cognitoUserPools: [userPool],
    });

    const authOptions = {
      authorizer,
      authorizationType: AuthorizationType.COGNITO,
    };

    const buildHandler = (id: string, handlerName: string, entryPath: string): NodejsFunction => {
      const fn = new NodejsFunction(this, id, {
        functionName: name(env_name, 'fn', handlerName),
        runtime: Runtime.NODEJS_22_X,
        entry: path.join(__dirname, '..', entryPath),
        handler: 'handler',
        timeout: Duration.seconds(29),
        memorySize: 512,
        environment: {
          TABLE_NAME: table.tableName,
          ALLOWED_ORIGINS: allowedOrigins.join(','),
        },
        bundling: {
          format: undefined,
          target: 'node22',
          externalModules: ['@aws-sdk/*'],
        },
      });

      table.grantReadWriteData(fn);
      return fn;
    };

    // Transactions
    const transactionsFn = buildHandler('TransactionsFn', 'transactions', 'functions/api/transactions.ts');
    transactionsFn.addEnvironment('RECEIPTS_BUCKET', receiptsBucket.bucketName);
    const transactions = api.root.addResource('transactions');
    transactions.addMethod('POST', new LambdaIntegration(transactionsFn), authOptions);
    transactions.addMethod('GET', new LambdaIntegration(transactionsFn), authOptions);
    const transactionById = transactions.addResource('{id}');
    transactionById.addMethod('GET', new LambdaIntegration(transactionsFn), authOptions);
    transactionById.addMethod('PUT', new LambdaIntegration(transactionsFn), authOptions);
    transactionById.addMethod('DELETE', new LambdaIntegration(transactionsFn), authOptions);

    // Receipts
    const receiptsFn = buildHandler('ReceiptsFn', 'receipts', 'functions/api/receipts.ts');
    receiptsFn.addEnvironment('RECEIPTS_BUCKET', receiptsBucket.bucketName);
    receiptsBucket.grantReadWrite(receiptsFn);
    const receipts = api.root.addResource('receipts');
    receipts.addResource('upload-url').addMethod('POST', new LambdaIntegration(receiptsFn), authOptions);
    receipts.addResource('{txId}').addMethod('GET', new LambdaIntegration(receiptsFn), authOptions);

    // Accounts
    const accountsFn = buildHandler('AccountsFn', 'accounts', 'functions/api/accounts.ts');
    const accounts = api.root.addResource('accounts');
    accounts.addMethod('POST', new LambdaIntegration(accountsFn), authOptions);
    accounts.addMethod('GET', new LambdaIntegration(accountsFn), authOptions);
    const accountById = accounts.addResource('{id}');
    accountById.addMethod('PUT', new LambdaIntegration(accountsFn), authOptions);
    accountById.addMethod('DELETE', new LambdaIntegration(accountsFn), authOptions);

    // Categories
    const categoriesFn = buildHandler('CategoriesFn', 'categories', 'functions/api/categories.ts');
    const categories = api.root.addResource('categories');
    categories.addMethod('POST', new LambdaIntegration(categoriesFn), authOptions);
    categories.addMethod('GET', new LambdaIntegration(categoriesFn), authOptions);
    const categoryBySlug = categories.addResource('{slug}');
    categoryBySlug.addMethod('PUT', new LambdaIntegration(categoriesFn), authOptions);
    categoryBySlug.addMethod('DELETE', new LambdaIntegration(categoriesFn), authOptions);

    // Budgets
    const budgetsFn = buildHandler('BudgetsFn', 'budgets', 'functions/api/budgets.ts');
    const budgets = api.root.addResource('budgets');
    budgets.addMethod('POST', new LambdaIntegration(budgetsFn), authOptions);
    budgets.addMethod('GET', new LambdaIntegration(budgetsFn), authOptions);
    const budgetByMonth = budgets.addResource('{month}');
    budgetByMonth.addMethod('PUT', new LambdaIntegration(budgetsFn), authOptions);

    // Settings
    const settingsFn = buildHandler('SettingsFn', 'settings', 'functions/api/settings.ts');
    const settings = api.root.addResource('settings');
    settings.addMethod('GET', new LambdaIntegration(settingsFn), authOptions);
    settings.addMethod('PUT', new LambdaIntegration(settingsFn), authOptions);

    // AI
    const aiFn = new NodejsFunction(this, 'AiFn', {
      functionName: name(env_name, 'fn', 'ai'),
      runtime: Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '..', 'functions', 'ai', 'handler.ts'),
      handler: 'handler',
      timeout: Duration.minutes(5),
      memorySize: 1024,
      environment: {
        TABLE_NAME: table.tableName,
        ALLOWED_ORIGINS: allowedOrigins.join(','),
      },
      bundling: {
        format: undefined,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
    });
    table.grantReadWriteData(aiFn);
    aiFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:GetParameter'],
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/wallet/*`],
      }),
    );
    aiFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: [`arn:aws:lambda:${this.region}:${this.account}:function:${name(env_name, 'fn', 'ai')}`],
      }),
    );
    aiFn.addEnvironment('RECEIPTS_BUCKET', receiptsBucket.bucketName);
    receiptsBucket.grantReadWrite(aiFn);
    const ai = api.root.addResource('ai');
    ai.addResource('categorize').addMethod('POST', new LambdaIntegration(aiFn), authOptions);
    const aiIntegration = new LambdaIntegration(aiFn, { timeout: Duration.seconds(29) });
    ai.addResource('extract-receipt').addMethod('POST', aiIntegration, authOptions);
    ai.addResource('insights').addMethod('POST', aiIntegration, authOptions);
    ai.addResource('forecast').addMethod('POST', aiIntegration, authOptions);
    ai.addResource('chat').addMethod('POST', aiIntegration, authOptions);
    ai.addResource('learn-category').addMethod('POST', aiIntegration, authOptions);
    ai.addResource('extract-recurring').addMethod('POST', aiIntegration, authOptions);
    ai.addResource('verify-payments').addMethod('POST', aiIntegration, authOptions);
    const aiJobs = ai.addResource('jobs');
    aiJobs.addResource('{jobId}').addMethod('GET', new LambdaIntegration(aiFn), authOptions);

    // Payments
    const paymentsFn = buildHandler('PaymentsFn', 'payments', 'functions/api/payments.ts');
    const payments = api.root.addResource('payments');
    payments.addMethod('POST', new LambdaIntegration(paymentsFn), authOptions);
    payments.addMethod('GET', new LambdaIntegration(paymentsFn), authOptions);
    const paymentById = payments.addResource('{id}');
    paymentById.addMethod('DELETE', new LambdaIntegration(paymentsFn), authOptions);

    // Recurring
    const recurringFn = buildHandler('RecurringFn', 'recurring', 'functions/api/recurring.ts');
    const recurring = api.root.addResource('recurring');
    recurring.addMethod('POST', new LambdaIntegration(recurringFn), authOptions);
    recurring.addMethod('GET', new LambdaIntegration(recurringFn), authOptions);
    const recurringById = recurring.addResource('{id}');
    recurringById.addMethod('PUT', new LambdaIntegration(recurringFn), authOptions);
    recurringById.addMethod('DELETE', new LambdaIntegration(recurringFn), authOptions);
    recurring.addResource('generate').addMethod('POST', new LambdaIntegration(recurringFn), authOptions);

    // Workspaces
    const workspacesFn = buildHandler('WorkspacesFn', 'workspaces', 'functions/api/workspaces.ts');
    const corsOptions = {
      allowOrigins: allowedOrigins,
      allowMethods: Cors.ALL_METHODS,
      allowHeaders: ['Content-Type', 'Authorization'],
    };
    const workspaces = api.root.addResource('workspaces', { defaultCorsPreflightOptions: corsOptions });
    workspaces.addMethod('POST', new LambdaIntegration(workspacesFn), authOptions);
    workspaces.addMethod('GET', new LambdaIntegration(workspacesFn), authOptions);
    const workspaceById = workspaces.addResource('{id}', { defaultCorsPreflightOptions: corsOptions });
    workspaceById.addMethod('PUT', new LambdaIntegration(workspacesFn), authOptions);
    workspaceById.addMethod('DELETE', new LambdaIntegration(workspacesFn), authOptions);

    // Workspace Shares
    const sharesFn = buildHandler('SharesFn', 'shares', 'functions/api/shares.ts');
    const shares = workspaceById.addResource('shares', { defaultCorsPreflightOptions: corsOptions });
    shares.addMethod('POST', new LambdaIntegration(sharesFn), authOptions);
    shares.addMethod('GET', new LambdaIntegration(sharesFn), authOptions);
    const shareByUser = shares.addResource('{userId}', { defaultCorsPreflightOptions: corsOptions });
    shareByUser.addMethod('PUT', new LambdaIntegration(sharesFn), authOptions);
    shareByUser.addMethod('DELETE', new LambdaIntegration(sharesFn), authOptions);

    // Admin - Costs
    const costsFn = buildHandler('CostsFn', 'costs', 'functions/api/costs.ts');
    costsFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ce:GetCostAndUsage', 'ce:GetCostForecast'],
        resources: ['*'],
      }),
    );
    const admin = api.root.addResource('admin');
    admin.addResource('costs').addMethod('GET', new LambdaIntegration(costsFn), authOptions);

    // Admin - Prompts
    const promptsFn = buildHandler('PromptsFn', 'prompts', 'functions/api/prompts.ts');
    const prompts = admin.addResource('prompts');
    prompts.addMethod('GET', new LambdaIntegration(promptsFn), authOptions);
    const promptByFeature = prompts.addResource('{feature}');
    promptByFeature.addMethod('GET', new LambdaIntegration(promptsFn), authOptions);
    promptByFeature.addMethod('PUT', new LambdaIntegration(promptsFn), authOptions);
  }
}
