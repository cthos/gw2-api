export class Memstore {
  protected cache: any = {};
  
  public async setItem(key: string, val: string) {
    this.cache[key] = val;
    return this;
  };

  public async getItem(key: string) {
    return this.cache[key];
  }
}