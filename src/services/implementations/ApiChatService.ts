import type { ChatService } from '@/types';
import type {
  Conversation,
  CreateConversationRequest,
  UpdateConversationRequest,
  Message,
  SendMessageRequest,
  ExpertProfile,
  ExpertQueue,
  ExpertAssignment,
  UpdateExpertProfileRequest,
} from '@/types';
import TokenManager from '@/services/TokenManager';
import { ApiErrorHandler } from '@/services/implementations/ApiErrorHandler';


interface ApiChatServiceConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

/**
 * API implementation of ChatService for production use
 * Uses fetch for HTTP requests
 */

type ApiJson =
  | Record<string, unknown>
  | { error?: string; errors?: string[] }
  | null;

export class ApiChatService implements ChatService {
  private baseUrl: string;
  private tokenManager: TokenManager;

  constructor(config: ApiChatServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.tokenManager = TokenManager.getInstance();
  }


  private buildUrl(endpoint: string): string {
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
    // 2. Get the token using this.tokenManager.getToken()
    // 3. Set up default headers including 'Content-Type': 'application/json'
    // 4. Add Authorization header with Bearer token if token exists
    // 5. Make the fetch request with the provided options
    // 6. Handle non-ok responses by throwing an error with status and message
    // 7. Return the parsed JSON response

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

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    // TODO: Implement getConversations method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return the array of conversations
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      return this.makeRequest<Conversation[]>('/conversations', { method: 'GET' });
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }

  }

  async getConversation(id: string): Promise<Conversation> {
    // TODO: Implement getConversation method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return the conversation object
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      return this.makeRequest<Conversation>(`/conversations/${encodeURIComponent(id)}`, {
        method: 'GET',
      });
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async createConversation(
    request: CreateConversationRequest
  ): Promise<Conversation> {
    // TODO: Implement createConversation method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return the created conversation object
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      return this.makeRequest<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async updateConversation(
    id: string,
    request: UpdateConversationRequest
  ): Promise<Conversation> {
    // SKIP, not currently used by application

    throw new Error('updateConversation method not implemented');
  }

  async deleteConversation(id: string): Promise<void> {
    // SKIP, not currently used by application

    throw new Error('deleteConversation method not implemented');
  }

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    // TODO: Implement getMessages method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return the array of messages
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      return this.makeRequest<Message[]>(
        `/conversations/${encodeURIComponent(conversationId)}/messages`,
        { method: 'GET' }
      );
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    // TODO: Implement sendMessage method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return the created message object
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      return this.makeRequest<Message>('/messages', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    // SKIP, not currently used by application

    throw new Error('markMessageAsRead method not implemented');
  }

  // Expert-specific operations
  async getExpertQueue(): Promise<ExpertQueue> {
    // TODO: Implement getExpertQueue method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return the expert queue object with waitingConversations and assignedConversations
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      return this.makeRequest<ExpertQueue>('/expert/queue', { method: 'GET' });
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async claimConversation(conversationId: string): Promise<void> {
    // TODO: Implement claimConversation method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return void (no response body expected)
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      await this.makeRequest<{ success: boolean }>(
        `/expert/conversations/${encodeURIComponent(conversationId)}/claim`,
        { method: 'POST' }
      );
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async unclaimConversation(conversationId: string): Promise<void> {
    // TODO: Implement unclaimConversation method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return void (no response body expected)
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      await this.makeRequest<{ success: boolean }>(
        `/expert/conversations/${encodeURIComponent(conversationId)}/unclaim`,
        { method: 'POST' }
      );
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async getExpertProfile(): Promise<ExpertProfile> {
    // TODO: Implement getExpertProfile method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return the expert profile object
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      return this.makeRequest<ExpertProfile>('/expert/profile', { method: 'GET' });
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async updateExpertProfile(
    request: UpdateExpertProfileRequest
  ): Promise<ExpertProfile> {
    // TODO: Implement updateExpertProfile method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return the updated expert profile object
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      return this.makeRequest<ExpertProfile>('/expert/profile', {
      method: 'PUT',
        body: JSON.stringify(request),
      });
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }

  async getExpertAssignmentHistory(): Promise<ExpertAssignment[]> {
    // TODO: Implement getExpertAssignmentHistory method
    // This should:
    // 1. Make a request to the appropriate endpoint
    // 2. Return the array of expert assignments
    //
    // See API_SPECIFICATION.md for endpoint details
    try {
      return this.makeRequest<ExpertAssignment[]>('/expert/assignments/history', { method: 'GET' });
    } catch(error: any) {
      const message = ApiErrorHandler.handle(error);
      throw new Error(message);
    }
  }
}
