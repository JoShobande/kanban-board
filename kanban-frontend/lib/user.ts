export function getCurrentUserId(): string | null {
  return localStorage.getItem("userId");
}

export function setCurrentUserId(userId: string) {
  localStorage.setItem("userId", userId);
}
