export class LoginLockoutService {
  private attempts = new Map<string, { count: number; lockedUntil: number }>();

  constructor(
    private readonly maxAttempts: number = 5,
    private readonly lockDurationSec: number = 900,
  ) {}

  check(email: string): { allowed: boolean; lockedUntil?: number } {
    const entry = this.attempts.get(email);
    if (!entry) return { allowed: true };

    if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
      return { allowed: false, lockedUntil: entry.lockedUntil };
    }

    if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
      this.attempts.delete(email);
      return { allowed: true };
    }

    return { allowed: true };
  }

  recordFailure(email: string): void {
    const entry = this.attempts.get(email) ?? { count: 0, lockedUntil: 0 };
    entry.count += 1;

    if (entry.count >= this.maxAttempts) {
      entry.lockedUntil = Date.now() + this.lockDurationSec * 1000;
    }

    this.attempts.set(email, entry);
  }

  reset(email: string): void {
    this.attempts.delete(email);
  }
}
