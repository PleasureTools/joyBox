export interface HttpClient {
  Get(url: string): Promise<string>;
}
