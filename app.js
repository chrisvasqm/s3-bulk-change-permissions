require('dotenv').config();
const aws = require('aws-sdk');

const spacesEndpoint = new aws.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY
});

const bucketName = process.env.DO_SPACES_BUCKET_NAME;

async function changeAcls() {
  try {
    const params = {
      Bucket: bucketName
    };

    const listAllKeys = async (token, accum = []) => {
      if (token) {
        params.ContinuationToken = token;
      }

      const data = await s3.listObjectsV2(params).promise();
      accum.push(...data.Contents);

      if (data.IsTruncated) {
        return listAllKeys(data.NextContinuationToken, accum);
      }

      return accum;
    };

    const objects = await listAllKeys();

    for (let obj of objects) {
      const aclParams = {
        Bucket: bucketName,
        Key: obj.Key,
        ACL: 'public-read'  // Change ACL as needed
      };

      await s3.putObjectAcl(aclParams).promise();
      console.log(`Set ACL to public-read for ${obj.Key}`);
    }

    console.log('All objects ACLs have been updated.');
  } catch (error) {
    console.error('Error updating objects ACLs:', error);
  }
}

changeAcls();
