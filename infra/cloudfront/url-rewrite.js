// CloudFront Function (viewer-request) attached to both lyrcloud.com distributions.
// - Redirects the bare domain to www. Cognito only allows www callback URLs, and
//   sessionStorage is per-origin, so sign-in must always happen on www.
// - Rewrites clean URLs to their S3 objects: /pricing -> /pricing/index.html.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value : '';

  if (host === 'lyrcloud.com') {
    var query = [];
    for (var key in request.querystring) {
      var param = request.querystring[key];
      var values = param.multiValue ? param.multiValue : [param];
      for (var i = 0; i < values.length; i++) {
        query.push(values[i].value === '' ? key : key + '=' + values[i].value);
      }
    }
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: 'https://www.lyrcloud.com' + uri + (query.length ? '?' + query.join('&') : '') },
        'cache-control': { value: 'public,max-age=3600' },
      },
    };
  }

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.substring(uri.lastIndexOf('/') + 1).indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }
  return request;
}
