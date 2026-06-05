@Library('shared-lib') _

buildFrontendPipelineForNextjs([

    // ── Required ──────────────────────────────────────────────────────────────
    appName        : 'candidate-onboarding-interface',

    // AWS Secrets Manager secret containing runtime config as a JSON object.
    // These values become window.__APP_CONFIG__ in the browser — they are NOT
    // passed to the Vite build process.
    //
    // Example secret stored at 'intranet/frontend/runtime-prod':
    // {
    // TIMESHEET_API_ENDPOINT: "http://localhost:5000",
    // USER_MANAGEMENT_URL: "http://13.48.18.145",
    // BASE_URL: "http://16.16.202.195:9999",
    // PMS_BASE_URL: "http://13.127.14.175",
    // MSOffice_USER_MANAGEMENT_URL: "http://13.48.18.145",
    // EMPLOYEE_ONBOARDING_URL: "http://16.16.202.195:9999" 
    // }
    //
    // Tip: use one secret per environment (runtime-dev, runtime-staging, runtime-prod).
    // The pipeline picks the right one based on branch name via loadEnv().
    envSecret      : 'dev-cof',

    s3Bucket       : 'paves-candidate-ui',
    cloudfrontId   : 'EYXHHDT9WEKB2',

    // ── Optional ──────────────────────────────────────────────────────────────
    cloudfrontDomain: 'd7sexzz68om8a.cloudfront.net',
    sonarProjectKey : 'intranet-candidate-onboarding-interface',
    nodeVersion     : 'NodeJS-22',
    awsRegion       : 'ap-south-1',
    buildDir        : 'out',
])