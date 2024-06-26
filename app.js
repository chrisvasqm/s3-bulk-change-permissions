require('dotenv').config();
const aws = require('aws-sdk');

const s3 = new aws.S3({
  endpoint: new aws.Endpoint('nyc3.digitaloceanspaces.com'),
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY
});

const bucketName = process.env.DO_SPACES_BUCKET_NAME;

async function changeFileAccessPermissions() {
  try {
    const params = {
      Bucket: bucketName
    };

    const listAllFiles = async (token, accum = []) => {
      if (token)
        params.ContinuationToken = token;

      const data = await s3.listObjectsV2(params).promise();
      accum.push(...data.Contents);

      if (data.IsTruncated)
        return listAllFiles(data.NextContinuationToken, accum);

      return accum;
    };

    const files = await listAllFiles();

    // Change ACL as needed
    // For Public: 'public-read'
    // For Private: 'private'
    const ACL = 'public-read';

    for (const file of files) {
      const aclParams = {
        Bucket: bucketName,
        Key: file.Key,
        ACL: ACL
      };

      await s3.putObjectAcl(aclParams).promise();
      console.log(`Set ACL to ${ACL} for ${file.Key}`);
    }

    console.log('All objects ACLs have been updated.');
  } catch (error) {
    console.error('Error updating objects ACLs:', error);
  }
}

changeFileAccessPermissions();
