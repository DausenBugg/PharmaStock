export function createProfileImage(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function revokeProfileImage(url: string | null): void {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}