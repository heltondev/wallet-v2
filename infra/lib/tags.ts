import { Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export function applyStandardTags(scope: Construct, env: string): void {
  Tags.of(scope).add('Project', 'wallet-v2');
  Tags.of(scope).add('Environment', env);
  Tags.of(scope).add('ManagedBy', 'cdk');
  Tags.of(scope).add('Owner', 'heltondev');
  Tags.of(scope).add('Repository', 'github.com/heltondev/wallet-v2');
  Tags.of(scope).add('CostCenter', 'wallet');
}
