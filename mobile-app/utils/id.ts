// Client-side temporary id for locally created (not yet saved) records.
// The server assigns the real, stable member id when a group is created.
export function createLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
