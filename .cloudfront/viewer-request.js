// CloudFront Viewer Request Function
// Attach to: Distribution → Behaviors → Default (*) → Viewer request
//
// What this does:
//   1. Blocks direct access to the /__/ placeholder paths (404)
//   2. Rewrites /onboarding/[real-token]/[page]/ → /onboarding/__/[page]/index.html
//      so S3 serves the right HTML shell while the browser URL keeps the real token
//   3. Appends index.html for directory-style paths (Next.js trailingSlash export)

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Block direct access to the __ placeholder — real users should never see this
  if (uri.startsWith('/onboarding/__')) {
    return {
      statusCode: 404,
      statusDescription: 'Not Found',
      headers: { 'content-type': { value: 'text/plain' } },
      body: 'Not Found',
    };
  }

  // Rewrite /onboarding/[any-token]/... → /onboarding/__/...
  var tokenMatch = uri.match(/^(\/onboarding\/)([^\/]+)(\/.*)?$/);
  if (tokenMatch) {
    uri = '/onboarding/__' + (tokenMatch[3] || '/');
  }

  // Append index.html for directory paths (Next.js static export with trailingSlash)
  if (uri.endsWith('/')) {
    uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    uri = uri + '/index.html';
  }

  request.uri = uri;
  return request;
}
