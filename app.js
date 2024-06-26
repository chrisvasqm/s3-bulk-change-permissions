require('dotenv').config();
const AWS = require('aws-sdk');

// Configure the AWS SDK for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com'); // Change to your region endpoint
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY, // Set your keys in environment variables
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY
});

const bucketName = 'your-space-name'; // Replace with your bucket name

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
