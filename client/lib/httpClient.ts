// // HTTP client utility using native fetch with better error handling
// // Alternative to undici for making HTTP requests

// interface RequestOptions {
//   method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
//   headers?: Record<string, string>;
//   body?: any;
//   timeout?: number;
// }

// interface ApiResponse<T = any> {
//   data: T | null;
//   error: string | null;
//   status: number;
// }

// class HttpClient {
//   private baseURL: string;
//   private defaultHeaders: Record<string, string>;

//   constructor(baseURL = '', defaultHeaders = {}) {
//     this.baseURL = baseURL;
//     this.defaultHeaders = {
//       'Content-Type': 'application/json',
//       ...defaultHeaders
//     };
//   }

//   private async makeRequest<T>(
//     url: string, 
//     options: RequestOptions = {}
//   ): Promise<ApiResponse<T>> {
//     const {
//       method = 'GET',
//       headers = {},
//       body,
//       timeout = 10000
//     } = options;

//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), timeout);

//     try {
//       const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
      
//       const response = await fetch(fullUrl, {
//         method,
//         headers: {
//           ...this.defaultHeaders,
//           ...headers
//         },
//         body: body ? JSON.stringify(body) : undefined,
//         signal: controller.signal
//       });

//       clearTimeout(timeoutId);

//       let data = null;
//       const contentType = response.headers.get('content-type');
      
//       if (contentType && contentType.includes('application/json')) {
//         data = await response.json();
//       } else {
//         data = await response.text();
//       }

//       if (!response.ok) {
//         return {
//           data: null,
//           error: data?.message || `HTTP ${response.status}: ${response.statusText}`,
//           status: response.status
//         };
//       }

//       return {
//         data,
//         error: null,
//         status: response.status
//       };

//     } catch (error: any) {
//       clearTimeout(timeoutId);
      
//       if (error.name === 'AbortError') {
//         return {
//           data: null,
//           error: 'Request timeout',
//           status: 408
//         };
//       }

//       return {
//         data: null,
//         error: error.message || 'Network error occurred',
//         status: 0
//       };
//     }
//   }

//   async get<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
//     return this.makeRequest<T>(url, { method: 'GET', headers });
//   }

//   async post<T>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
//     return this.makeRequest<T>(url, { method: 'POST', body, headers });
//   }

//   async put<T>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
//     return this.makeRequest<T>(url, { method: 'PUT', body, headers });
//   }

//   async delete<T>(url: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
//     return this.makeRequest<T>(url, { method: 'DELETE', headers });
//   }

//   async patch<T>(url: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
//     return this.makeRequest<T>(url, { method: 'PATCH', body, headers });
//   }
// }

// // Create default instance
// export const httpClient = new HttpClient();

// // Create instance with custom base URL
// export const createHttpClient = (baseURL: string, defaultHeaders?: Record<string, string>) => {
//   return new HttpClient(baseURL, defaultHeaders);
// };

// // Utility functions for common use cases
// export const api = {
//   get: <T>(url: string, headers?: Record<string, string>) => httpClient.get<T>(url, headers),
//   post: <T>(url: string, body?: any, headers?: Record<string, string>) => httpClient.post<T>(url, body, headers),
//   put: <T>(url: string, body?: any, headers?: Record<string, string>) => httpClient.put<T>(url, body, headers),
//   delete: <T>(url: string, headers?: Record<string, string>) => httpClient.delete<T>(url, headers),
//   patch: <T>(url: string, body?: any, headers?: Record<string, string>) => httpClient.patch<T>(url, body, headers),
// };

// export default httpClient;