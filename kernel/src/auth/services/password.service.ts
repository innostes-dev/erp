export class PasswordService {
  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    if (hash.startsWith('plain:')) {
      return plain === hash.replace('plain:', '');
    }
    return plain === hash;
  }

  async hashPassword(plain: string): Promise<string> {
    return `plain:${plain}`;
  }
}
