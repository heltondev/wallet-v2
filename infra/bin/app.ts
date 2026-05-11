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

const DOMAIN_NAME = 'wallet.oliverapp.net';
const CERTIFICATE_ARN = 'arn:aws:acm:us-east-1:932506092985:certificate/db9f81b1-5841-4dc3-849c-a297b53205d0';
const HOSTED_ZONE_ID = 'Z02902832F0JM3NKHRMRX';
const HOSTED_ZONE_NAME = 'oliverapp.net';

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
  allowedOrigins: [`https://${DOMAIN_NAME}`, 'http://localhost:5173'],
});
api.addDependency(database);
api.addDependency(auth);

const frontend = new FrontendStack(app, `wallet-${env_name}-frontend`, {
  env,
  env_name,
  accountId: account || '',
  domainName: DOMAIN_NAME,
  certificateArn: CERTIFICATE_ARN,
  hostedZoneId: HOSTED_ZONE_ID,
  hostedZoneName: HOSTED_ZONE_NAME,
});
frontend.addDependency(api);

applyStandardTags(app, env_name);

app.synth();
