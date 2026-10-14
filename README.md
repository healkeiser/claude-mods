<div align="center">

  <img src="https://cdn.simpleicons.org/claude/D97757" alt="Claude" width="96">

  <h3 align="center">claude-mods</h3>

  <p align="center">
    Claude Code mods that make the terminal easier to read: polished replies, a live working band, and prompts you can find again.
    <br/><br/>
    <a href="https://claude.com/resources/articles/claude-code-mods"><strong>What are mods?</strong></a>
  </p>

  ##

  <p align="center">
    <!-- Maintenance status -->
    <img src="https://img.shields.io/badge/maintenance-actively--developed-brightgreen.svg?&label=Maintenance">&nbsp;&nbsp;
    <!-- License -->
    <img src="https://img.shields.io/badge/License-MIT-brightgreen.svg?&logo=open-source-initiative&logoColor=white" alt="License: MIT"/>&nbsp;&nbsp;
    <!-- Claude Code version -->
    <img src="https://img.shields.io/badge/Claude%20Code-2.1.287%2B-D97757?&logo=claude&logoColor=white" alt="Claude Code 2.1.287+"/>&nbsp;&nbsp;
    <!-- Last Commit -->
    <img src="https://img.shields.io/github/last-commit/healkeiser/claude-mods?logo=github&label=Last%20Commit" alt="Last Commit"/>&nbsp;&nbsp;
    <!-- Commit Activity -->
    <a href="https://github.com/healkeiser/claude-mods/pulse" alt="Activity">
      <img src="https://img.shields.io/github/commit-activity/m/healkeiser/claude-mods?&logo=github&label=Commit%20Activity"/></a>&nbsp;&nbsp;
    <!-- GitHub stars -->
    <img src="https://img.shields.io/github/stars/healkeiser/claude-mods" alt="GitHub Stars"/>
  </p>

</div>



<!-- TABLE OF CONTENTS -->
## Table of Contents

- [About](#about)
- [Installation](#installation)
- [Usage](#usage)
  - [pretty-markdown](#pretty-markdown)
  - [working-band](#working-band)
  - [prompt-cards](#prompt-cards)
- [Security](#security)
- [Development](#development)
- [License](#license)
- [Contact](#contact)



<!-- ABOUT -->
## About

Three [mods](https://claude.com/resources/articles/claude-code-mods) for [Claude Code](https://claude.com/claude-code): small TypeScript modules that redraw parts of its terminal interface. Each one works on its own, so install only the ones you want.

| Mod | What it changes |
|-----|-----------------|
| **pretty-markdown** | Claude's replies: bordered code blocks with a copy button, inline-code chips, coloured diffs, rounded tables, accented headings, callouts, and a highlighted `Next:` line |
| **working-band** | The line above the prompt while Claude works, the folded tool rows, and the footer that closes each turn |
| **prompt-cards** | Your own prompts: a blue card per prompt, a grey card while one is queued, and a `/prompts` pane to jump back to any of them |



<!-- INSTALLATION -->
## Installation

Add this repository as a plugin marketplace, then install the mods you want at user scope:

``` shell
claude plugin marketplace add healkeiser/claude-mods
claude plugin install pretty-markdown@claude-mods --scope user
claude plugin install working-band@claude-mods --scope user
claude plugin install prompt-cards@claude-mods --scope user
```

Run `/reload-plugins` in a session that is already open; new sessions load them by themselves.

> [!IMPORTANT]
> Mods need Claude Code **2.1.287** or later.



<!-- USAGE -->
## Usage

### pretty-markdown

Redraws each block of Claude's reply that has something to gain; plain prose keeps Claude Code's own look.

- **Code blocks** draw in a rounded border with their language and a `⧉ copy` button. Past 10 lines they get line numbers; past 20 they fold to 12 with a `▾ show all N lines` button.
- **Inline code** becomes a tinted chip.
- **Diff fences** (` ```diff `) draw in red and green, a hunk header added when the fence has none.
- **Tables** draw in a rounded border with a bold header row; a table too wide for the window narrows its widest column and wraps it.
- **Headings** (`##` lines and bold-only lines such as `**What changed:**`) draw in the accent colour with a rule under them.
- **Callouts** (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`) get their own colour and icon.
- A paragraph opening with **`Next:`** draws in its own box, so the action a reply ends on is easy to spot.

### working-band

- While a turn runs, the band above the prompt reads `⠹ editing parse.ts  ·  3 tools  ·  42s`: a spinner, the current action, the tool count and the elapsed time.
- Folded tool rows read `◇ 3 reads  ·  ⌕ 2 searches  ·  ⌘ 1 shell`, dim, with failures in red.
- The footer of a turn that used tools reads `✻ Baked for 29s  ·  6 tools  ·  2 files edited`.

### prompt-cards

- Each prompt you send draws as a blue card, so your messages stand out when you scroll.
- A prompt sent while Claude is still working draws as a narrow grey `⏸ queued` card until it reaches the model. A queued slash command stays queued until the turn ends, which is when Claude Code runs it.
- `/prompts` opens a pane listing your prompts, newest first. Pick one to scroll the transcript back to it; `1` to `9` reach the nine newest.

> [!NOTE]
> Clicking a button (copy, fold, a row of the `/prompts` pane) needs Claude Code's fullscreen layout, where the terminal reports clicks. The pane's hotkeys work either way.

> [!NOTE]
> Colours are tuned for dark themes: the inline-code chip and the prompt card's background are fixed colours, and read as dark bands on a light theme.



<!-- SECURITY -->
## Security

Mods are not sandboxed: they run with the same access to your machine as Claude Code itself. These three only draw and count; none of them runs a command, reads your files, or makes a network call. Read `hooks/` before installing, as you would for any plugin.



<!-- DEVELOPMENT -->
## Development

Each mod is a plugin folder: `.claude-plugin/plugin.json`, `hooks/hooks.json`, and the hooks module `hooks/register.tsx`, with its tests beside it.

``` shell
git clone https://github.com/healkeiser/claude-mods
cd claude-mods
claude plugin marketplace add ./
claude plugin validate ./pretty-markdown
claude plugin test ./pretty-markdown
```

A marketplace added from a local folder is read in place: edit a mod, run `/reload-plugins`, and the session picks it up with no reinstall.



<!-- LICENSE -->
## License

MIT. See [LICENSE](./LICENSE).

> [!NOTE]
> Claude and Claude Code are trademarks of Anthropic. These mods are an independent community project and are not affiliated with, endorsed by, or sponsored by Anthropic.



<!-- CONTACT -->
## Contact

Project Link: [claude-mods](https://github.com/healkeiser/claude-mods)

<p align='center'>
  <!-- GitHub profile -->
  <a href="https://github.com/healkeiser">
    <img src="https://img.shields.io/badge/healkeiser-181717?logo=github&style=social" alt="GitHub"/></a>&nbsp;&nbsp;
  <!-- LinkedIn -->
  <a href="https://www.linkedin.com/in/valentin-beaumont">
    <img src="https://img.shields.io/badge/Valentin%20Beaumont-0A66C2?logo=linkedin&style=social" alt="LinkedIn"/></a>&nbsp;&nbsp;
  <!-- Behance -->
  <a href="https://www.behance.net/el1ven">
    <img src="https://img.shields.io/badge/el1ven-1769FF?logo=behance&style=social" alt="Behance"/></a>&nbsp;&nbsp;
  <!-- X -->
  <a href="https://twitter.com/valentinbeaumon">
    <img src="https://img.shields.io/badge/@valentinbeaumon-1DA1F2?logo=x&style=social" alt="Twitter"/></a>&nbsp;&nbsp;
  <!-- Instagram -->
  <a href="https://www.instagram.com/val.beaumontart">
    <img src="https://img.shields.io/badge/@val.beaumontart-E4405F?logo=instagram&style=social" alt="Instagram"/></a>&nbsp;&nbsp;
  <!-- Gumroad -->
  <a href="https://healkeiser.gumroad.com/subscribe">
    <img src="https://img.shields.io/badge/healkeiser-36a9ae?logo=gumroad&style=social" alt="Gumroad"/></a>&nbsp;&nbsp;
  <!-- Gmail -->
  <a href="mailto:valentin.onze@gmail.com">
    <img src="https://img.shields.io/badge/valentin.onze@gmail.com-D14836?logo=gmail&style=social" alt="Email"/></a>&nbsp;&nbsp;
  <!-- Buy me a coffee -->
  <a href="https://www.buymeacoffee.com/healkeiser">
    <img src="https://img.shields.io/badge/Buy Me A Coffee-FFDD00?&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee"/></a>&nbsp;&nbsp;
</p>
