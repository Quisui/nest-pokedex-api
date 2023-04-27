export interface HttpAdapter<T> {
  get(url: string): Promise<T>;
}
