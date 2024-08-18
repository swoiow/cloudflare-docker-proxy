// Define base domain as a constant
const BASE_DOMAIN = "你的域名";

// Routes for different Docker registries
const dockerHub = "https://registry-1.docker.io";
const routes = {
  [`docker.${BASE_DOMAIN}`]: dockerHub,
  [`quay.${BASE_DOMAIN}`]: "https://quay.io",
  [`gcr.${BASE_DOMAIN}`]: "https://gcr.io",
  [`k8s-gcr.${BASE_DOMAIN}`]: "https://k8s.gcr.io",
  [`k8s.${BASE_DOMAIN}`]: "https://registry.k8s.io",
  [`ghcr.${BASE_DOMAIN}`]: "https://ghcr.io",
  [`cloudsmith.${BASE_DOMAIN}`]: "https://docker.cloudsmith.io",
  [`ecr.${BASE_DOMAIN}`]: "https://public.ecr.aws",
};

// Main export function: Handles all incoming requests
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const upstream = routeByHosts(url.hostname);  // Determine the upstream registry based on the hostname

    // Return 404 if no matching upstream is found
    if (!upstream) {
      return new Response(JSON.stringify({ routes }), { status: 404 });
    }

    const authorization = request.headers.get("Authorization");  // Get the Authorization header
    const isDockerHub = upstream === dockerHub;  // Check if the request is targeting DockerHub

    // Use switch to manage different URL paths
    switch (true) {
      // Handle Docker registry root requests
      case url.pathname === "/v2/":
        return await handleRegistryRootRequest(url, upstream, authorization);

      // Handle authentication requests
      case url.pathname === "/v2/auth":
        return await handleAuthRequest(url, upstream, isDockerHub, authorization);

      // Handle all other requests and check for DockerHub specific redirects
      default:
        if (isDockerHub && shouldRedirectForDockerHub(url)) {
          return handleDockerHubRedirect(url);  // Redirect to library namespace for DockerHub images
        } else {
          return await forwardRequest(upstream, url, request);  // Forward the request to the upstream registry
        }
    }
  },
};

// Function to map hostnames to routes based on the routes object
function routeByHosts(host) {
  return routes[host] || "";
}

// Handle requests to the Docker registry root (e.g., /v2/)
async function handleRegistryRootRequest(url, upstream, authorization) {
  const headers = new Headers();
  if (authorization) headers.set("Authorization", authorization);  // Set Authorization header if provided

  // Forward the request to the upstream registry
  const resp = await fetch(`${upstream}/v2/`, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  // Handle 401 Unauthorized responses by returning a WWW-Authenticate header
  if (resp.status === 401) {
    headers.set("Www-Authenticate", `Bearer realm="https://${url.hostname}/v2/auth",service="cloudflare-docker-proxy"`);
    return new Response(JSON.stringify({ message: "UNAUTHORIZED" }), { status: 401, headers });
  }

  // Return the original response if not unauthorized
  return resp;
}

// Handle authentication requests by fetching a token from the authentication service
async function handleAuthRequest(url, upstream, isDockerHub, authorization) {
  const resp = await fetch(`${upstream}/v2/`, { method: "GET", redirect: "follow" });

  // If no authentication is needed, return the response directly
  if (resp.status !== 401) return resp;

  const authenticateStr = resp.headers.get("WWW-Authenticate");
  if (!authenticateStr) return resp;  // If no WWW-Authenticate header, return the original response

  const wwwAuthenticate = parseAuthenticate(authenticateStr);  // Parse the WWW-Authenticate header
  let scope = url.searchParams.get("scope");

  // Adjust the scope for DockerHub library images (e.g., repository:busybox:pull -> repository:library/busybox:pull)
  if (scope && isDockerHub) {
    scope = adjustScopeForDockerHub(scope);
  }

  // Fetch the authentication token
  return await fetchToken(wwwAuthenticate, scope, authorization);
}

// Adjust scope for DockerHub library images
function adjustScopeForDockerHub(scope) {
  const scopeParts = scope.split(":");
  // Insert 'library/' if the repository part does not include a namespace
  if (scopeParts.length === 3 && !scopeParts[1].includes("/")) {
    scopeParts[1] = `library/${scopeParts[1]}`;
    return scopeParts.join(":");
  }
  return scope;
}

// Check if DockerHub redirect is necessary based on the URL path
function shouldRedirectForDockerHub(url) {
  const pathParts = url.pathname.split("/");
  return pathParts.length === 5;  // DockerHub image paths should have 5 parts
}

// Handle DockerHub redirects for library images
function handleDockerHubRedirect(url) {
  const pathParts = url.pathname.split("/");
  pathParts.splice(2, 0, "library");  // Insert 'library' into the URL path for DockerHub images
  const redirectUrl = new URL(url);
  redirectUrl.pathname = pathParts.join("/");
  return Response.redirect(redirectUrl.toString(), 301);  // Return a 301 redirect response
}

// Forward all other requests to the upstream registry
async function forwardRequest(upstream, url, request) {
  const newUrl = new URL(upstream + url.pathname);
  const newRequest = new Request(newUrl, {
    method: request.method,
    headers: request.headers,
    redirect: "follow",
  });
  return await fetch(newRequest);  // Forward the request with the same method and headers
}

// Parse WWW-Authenticate header to extract realm and service
function parseAuthenticate(authenticateStr) {
  // Sample: Bearer realm="https://auth.ipv6.docker.com/token",service="registry.docker.io"
  // Match strings after =" and before "
  const re = /(?<=\=")(?:\\.|[^"\\])*(?=")/g;
  const matches = authenticateStr.match(re);

  if (!matches || matches.length < 2) {
    throw new Error(`Invalid WWW-Authenticate Header: ${authenticateStr}`);
  }

  return {
    realm: matches[0],
    service: matches[1],
  };
}

// Fetch token from the authentication service
async function fetchToken(wwwAuthenticate, scope, authorization) {
  const url = new URL(wwwAuthenticate.realm);
  if (wwwAuthenticate.service) url.searchParams.set("service", wwwAuthenticate.service);  // Set service parameter
  if (scope) url.searchParams.set("scope", scope);  // Set scope parameter if provided

  const headers = new Headers();
  if (authorization) headers.set("Authorization", authorization);  // Include Authorization header if provided

  return await fetch(url, { method: "GET", headers });  // Fetch the token
}
