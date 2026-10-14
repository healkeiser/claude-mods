# claude-mods

Three [Claude Code mods](https://claude.com/resources/articles/claude-code-mods) that make the terminal easier to read.

| Mod | What it does |
| --- | --- |
| `pretty-markdown` | Draws code blocks with a rounded border, a language label, a copy button, folding past 20 lines and line numbers past 10. Inline code becomes a tinted chip. Also draws coloured diffs, tables with rounded borders, accented headings, `> [!WARNING]`-style callouts, and the `Next:` line of a reply in its own box. |
| `working-band` | While Claude works, a line above the prompt shows a spinner, the current action, the tool count and the elapsed time. Folded tool rows read as `◇ 3 reads · ⌘ 2 shells`, and each turn ends with `✻ 29s · 6 tools · 2 files edited`. |
| `prompt-cards` | Draws each prompt you send as a blue card, so you can find it when scrolling. A prompt queued while Claude works shows as a narrow grey `⏸ queued` card until it is delivered. `/prompts` opens a pane listing your prompts; pick one to jump to it. |

## Install

Needs Claude Code 2.1.287 or later.

```bash
claude plugin marketplace add healkeiser/claude-mods
claude plugin install pretty-markdown@claude-mods --scope user
claude plugin install working-band@claude-mods --scope user
claude plugin install prompt-cards@claude-mods --scope user
```

Then run `/reload-plugins` in an open session, or start a new one.

Each mod works on its own; install only the ones you want.

## Notes

- Mods are not sandboxed: they run with Claude Code's own access to your machine. Read `hooks/` before installing.
- Colours are tuned for dark themes. The inline-code chip and the prompt card background are fixed colours.
- Clicks on buttons (copy, fold, the `/prompts` list) need the fullscreen terminal layout. The `/prompts` pane also answers the hotkeys `1` to `9`.
- Claude Code gives a prompt row no "queued" flag, so `prompt-cards` works it out from when the row appears and when the prompt reaches the model.

## Develop

Each mod is a plugin folder: `.claude-plugin/plugin.json`, `hooks/hooks.json` and `hooks/register.tsx`. Check one with:

```bash
claude plugin validate ./pretty-markdown
claude plugin test ./pretty-markdown
```

When the marketplace is added from a local clone (`claude plugin marketplace add ./`), edits are picked up by `/reload-plugins` with no reinstall.
