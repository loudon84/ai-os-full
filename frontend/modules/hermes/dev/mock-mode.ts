export function isHermesMockModeEnabled() {
  return process.env.NEXT_PUBLIC_HERMES_MOCK_MODE === "true";
}
