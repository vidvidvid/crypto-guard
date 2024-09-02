export function extractDomain(url: string) {
  let domain;

  // Remove protocol (http, https, etc.)
  if (url.indexOf("://") > -1) {
    domain = url.split("/")[2];
  } else {
    domain = url.split("/")[0];
  }

  // Remove port number if present
  domain = domain.split(":")[0];

  // Remove 'www.' prefix if present
  domain = domain.replace(/^www\./, "");

  return domain;
}
