export class BidMutex {
  private locked = false;

  async lock(): Promise<void> {
    while (this.locked) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for unlock
    }
    this.locked = true;
  }

  unlock(): void {
    this.locked = false;
  }
}
