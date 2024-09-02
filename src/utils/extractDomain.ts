export function extractDomain(url: string) {
  let domain;

  // Remove protocol (http, https, etc.)
  if (url.indexOf("://") > -1) {
    domain = url.split("/")[2]; // Get everything between '://' and the first '/'
  } else {
    domain = url.split("/")[0]; // Handle URLs without protocol
  }

  return domain;
}
