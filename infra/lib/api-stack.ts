import { Duration, Stack, StackProps } from 'aws-cdk-lib';
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
import { Construct } from 'constructs';
import { name } from './naming';
import * as path from 'path';

interface ApiStackProps extends StackProps {
  env_name: string;
  table: Table;
  userPool: UserPool;
  allowedOrigins: string[];
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { env_name, table, userPool, allowedOrigins } = props;

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
    const transactions = api.root.addResource('transactions');
    transactions.addMethod('POST', new LambdaIntegration(transactionsFn), authOptions);
    transactions.addMethod('GET', new LambdaIntegration(transactionsFn), authOptions);
    const transactionById = transactions.addResource('{id}');
    transactionById.addMethod('GET', new LambdaIntegration(transactionsFn), authOptions);
    transactionById.addMethod('PUT', new LambdaIntegration(transactionsFn), authOptions);
    transactionById.addMethod('DELETE', new LambdaIntegration(transactionsFn), authOptions);

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
    const aiFn = buildHandler('AiFn', 'ai', 'functions/ai/handler.ts');
    const ai = api.root.addResource('ai');
    ai.addResource('categorize').addMethod('POST', new LambdaIntegration(aiFn), authOptions);
    ai.addResource('extract-receipt').addMethod('POST', new LambdaIntegration(aiFn), authOptions);
    ai.addResource('insights').addMethod('POST', new LambdaIntegration(aiFn), authOptions);
    ai.addResource('forecast').addMethod('POST', new LambdaIntegration(aiFn), authOptions);
    ai.addResource('chat').addMethod('POST', new LambdaIntegration(aiFn), authOptions);

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
  }
}
