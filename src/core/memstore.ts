export class Memstore {
  protected cache: any = {};
  
  public setItem(key, val) {
    this.cache[key] = val;
    return this;
  };

  public getItem(key: string) {
    return this.cache[key];
  }
}