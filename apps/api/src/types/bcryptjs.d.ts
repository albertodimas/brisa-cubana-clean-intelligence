declare module "bcryptjs" {
  export function hash(
    data: string | Buffer,
    salt: string | number,
  ): Promise<string>;
  export function compare(
    data: string | Buffer,
    encrypted: string,
  ): Promise<boolean>;
}
