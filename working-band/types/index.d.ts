export type Activity = { label: string; tools: number; frames: number }

declare module 'claude-code' {
  interface PluginState {
    'working-band': { activity: Activity | null }
  }
}
