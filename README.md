# Work less do more

This application uses the Github API to collect metrics on the Node.js runtime to correlate it with survey in a Google Form. It is hosted on a Google Cloud Function.

To generate the productivity chart you may either deploy the Cloud Function or run the generation code locally. 

## Set up

1. Enable Cloud Functions, Drive API and Sheets API in a Google Cloud Project
1. Authenticate with gcloud to a project with Cloud Functions enabled: ` $ gcloud auth application-default login`
1. Acquire a Github token and store in /functions

## Reference Material

1. Sheets API: developers.google.com/sheets/api/
1. Cloud Functions: cloud.google.com/functions/
1. Cloud Scheduler: cloud.google.com/scheduler/
1. Octokit(Node): https://www.npmjs.com/package/@octokit/rest
