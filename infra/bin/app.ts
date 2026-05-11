#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { AuthStack } from '../lib/auth-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { applyStandardTags } from '../lib/tags';

const app = new App();

const env_name = app.node.tryGetContext('env') || 'prod';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

const env = { account, region };

const database = new DatabaseStack(app, `wallet-${env_name}-database`, {
  env,
  env_name,
});

const auth = new AuthStack(app, `wallet-${env_name}-auth`, {
  env,
  env_name,
  table: database.table,
});
auth.addDependency(database);

const api = new ApiStack(app, `wallet-${env_name}-api`, {
  env,
  env_name,
  table: database.table,
  userPool: auth.userPool,
  allowedOrigins: ['http://localhost:5173', 'http://localhost:3000'],
});
api.addDependency(database);
api.addDependency(auth);

new FrontendStack(app, `wallet-${env_name}-frontend`, {
  env,
  env_name,
  accountId: account || '',
});

applyStandardTags(app, env_name);

app.synth();
