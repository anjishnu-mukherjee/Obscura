// // Alternative fetch implementation using XMLHttpRequest for older browsers
// // or environments where fetch might not be available

// interface FetchOptions {
//   method?: string;
//   headers?: Record<string, string>;
//   body?: string | FormData | null;
//   timeout?: number;
// }

// interface FetchResponse {
//   ok: boolean;
//   status: number;
//   statusText: string;
//   headers: Map<string, string>;
//   json: () => Promise<any>;
//   text: () => Promise<string>;
// }

// export function fetchAlternative(url: string, options: FetchOptions = {}): Promise<FetchResponse> {
//   return new Promise((resolve, reject) => {
//     const xhr = new XMLHttpRequest();
//     const {
//       method = 'GET',
//       headers = {},
//       body = null,
//       timeout = 10000
//     } = options;

//     xhr.timeout = timeout;
//     xhr.open(method, url, true);

//     // Set headers
//     Object.entries(headers).forEach(([key, value]) => {
//       xhr.setRequestHeader(key, value);
//     });

//     // Handle response
//     xhr.onload = () => {
//       const responseHeaders = new Map<string, string>();
//       const headerString = xhr.getAllResponseHeaders();
      
//       headerString.split('\r\n').forEach(line => {
//         const [key, value] = line.split(': ');
//         if (key && value) {
//           responseHeaders.set(key.toLowerCase(), value);
//         }
//       });

//       const response: FetchResponse = {
//         ok: xhr.status >= 200 && xhr.status < 300,
//         status: xhr.status,
//         statusText: xhr.statusText,
//         headers: responseHeaders,
//         json: async () => {
//           try {
//             return JSON.parse(xhr.responseText);
//           } catch (error) {
//             throw new Error('Invalid JSON response');
//           }
//         },
//         text: async () => xhr.responseText
//       };

//       resolve(response);
//     };

//     xhr.onerror = () => {
//       reject(new Error('Network error'));
//     };

//     xhr.ontimeout = () => {
//       reject(new Error('Request timeout'));
//     };

//     xhr.onabort = () => {
//       reject(new Error('Request aborted'));
//     };

//     // Send request
//     xhr.send(body);
//   });
// }

// // Polyfill for environments without fetch
// export function setupFetchPolyfill() {
//   if (typeof globalThis !== 'undefined' && !globalThis.fetch) {
//     globalThis.fetch = fetchAlternative as any;
//   }
  
//   if (typeof window !== 'undefined' && !window.fetch) {
//     window.fetch = fetchAlternative as any;
//   }
// }

// // Auto-setup polyfill
// if (typeof window !== 'undefined') {
//   setupFetchPolyfill();
// }