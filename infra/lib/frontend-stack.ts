import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  CloudFrontWebDistribution,
  OriginAccessIdentity,
} from 'aws-cdk-lib/aws-cloudfront';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { bucketName } from './naming';

interface FrontendStackProps extends StackProps {
  env_name: string;
  accountId: string;
}

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { env_name, accountId } = props;

    const spaBucket = new Bucket(this, 'SpaBucket', {
      bucketName: bucketName(env_name, 'spa', accountId),
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const oai = new OriginAccessIdentity(this, 'OAI');
    spaBucket.grantRead(oai);

    const distribution = new CloudFrontWebDistribution(this, 'Distribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: spaBucket,
            originAccessIdentity: oai,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      defaultRootObject: 'index.html',
      errorConfigurations: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
        {
          errorCode: 404,
          responseCode: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    new CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new CfnOutput(this, 'BucketName', {
      value: spaBucket.bucketName,
      description: 'S3 bucket name for SPA assets',
    });
  }
}
