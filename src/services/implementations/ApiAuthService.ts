import type {
  AuthService,
  RegisterRequest,
  User,
  AuthServiceConfig,
} from '@/types';
import TokenManager from '@/services/TokenManager';
import { ApiErrorHandler } from '@/services/implementations/ApiErrorHandler';

/**
 * API-based implementation of AuthService
 * Uses fetch for HTTP requests
 */
type ApiJson =
  | Record<string, unknown>
  | { error?: string; errors?: string[] }
  | null;

export class ApiAuthService implements AuthService {
  private baseUrl: string;
  private tokenManager: TokenManager;

  constructor(config: AuthServiceConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.tokenManager = TokenManager.getInstance();
  }

  private buildUrl(endpoint: string) {
    return `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  private extractErrorMessage(statusText: string, payload: ApiJson): string {
    if (!payload) return statusText || 'Request failed';
    const e = (payload as any).error as string | undefined;
    const es = (payload as any).errors as string[] | undefined;
    if (e && typeof e === 'string') return e;
    if (Array.isArray(es) && es.length) return es.join('; ');
    return statusText || 'Request failed';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // TODO: Implement the makeRequest helper method
    // This should:
    // 1. Construct the full URL using this.baseUrl and endpoint
    // 2. Set up default headers including 'Content-Type': 'application/json'
    // 3. Use {credentials: 'include'} for session cookies
    // 4. Make the fetch request with the provided options
    // 5. Handle non-ok responses by throwing an error with status and message
    // 6. Return the parsed JSON response
    const url = this.buildUrl(endpoint);

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    });

    const token = (this.tokenManager as any).getToken?.();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let resp: Response;

    try {
      resp = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
      });
    } catch (fetchError: any) {
      console.error(`[makeRequest] Network error while fetching ${url}:`, fetchError);
      throw new Error(`Network request failed: ${fetchError.message || fetchError}`);
    }

    let body: ApiJson = null;
    const ct = resp.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
   
    if (isJson) {
      try {
        const jsonData = await resp.json();
        body = jsonData;
      } catch (jsonError: any) {
        console.warn(`[makeRequest] Failed to parse JSON from ${url}:`, jsonError);
        body = null;
      }
    } else {
        try {
          const textData = await resp.text();
          body = textData as unknown as ApiJson;
        } catch (textError: any) {
          console.warn(`[makeRequest] Failed to read text body from ${url}:`, textError);
          body = null;
        }
    }

    if (!resp.ok) {
      const message = this.extractErrorMessage(resp.statusText, body);
      const err = new Error(message) as Error & { status?: number; body?: ApiJson };
      err.status = resp.status;
      err.body = body;
      throw err;
    }

    return body as T;
  }

  async login(username: string, password: string): Promise<User> {
    // TODO: Implement login method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Store the token using this.tokenManager.setToken(response.token)
    // 3. Return the user object
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      const res = await this.makeRequest<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      this.tokenManager.setToken(res.token);
      return res.user;
    } catch (error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async register(userData: RegisterRequest): Promise<User> {
    // TODO: Implement register method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Store the token using this.tokenManager.setToken(response.token)
    // 3. Return the user object
    //
    // See API_SPECIFICATION.md for endpoint details
    try {

      const res = await this.makeRequest<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      this.tokenManager.setToken(res.token);
      return res.user;
    } catch (error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    // TODO: Implement logout method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Handle errors gracefully (continue with logout even if API call fails)
    // 3. Clear the token using this.tokenManager.clearToken()
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      await this.makeRequest<{ message: string }>('/auth/logout', { method: 'POST' });
    } catch(e: any) {
      const message = ApiErrorHandler.handle(e);
      console.warn('[logout] Backend logout failed, proceeding with local logout:', message);
    } finally {
      this.tokenManager.clearToken();
    }
  }

  async refreshToken(): Promise<User> {
    // TODO: Implement refreshToken method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 3. Update the stored token using this.tokenManager.setToken(response.token)
    // 4. Return the user object
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      const res = await this.makeRequest<{ user: User; token: string }>('/auth/refresh', {
        method: 'POST',
      });
      this.tokenManager.setToken(res.token);
      return res.user;
    } catch (error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // TODO: Implement getCurrentUser method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return the user object if successful
    // 3. If the request fails (e.g., session invalid), clear the token and return null
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      const user = await this.makeRequest<User>('/auth/me', { method: 'GET' });
      return user;
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        this.tokenManager.clearToken();
        return null;
      }
      const message = ApiErrorHandler.handle(e);
      throw new Error(message);
    }
  }
}
