import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { FoldId } from '../types'
import { asHunk, parse } from './parse'
import type { Align, CalloutType, Line, Part, Span } from './parse'

const CHIP_BG = '#2f3440'
const CHIP_FG = '#e5c07b'
const FOLD_OVER = 20
const FOLD_TO = 12
const NUMBER_OVER = 10

const CALLOUT: Record<CalloutType, { color: string; title: string }> = {
  note: { color: 'suggestion', title: 'ℹ Note' },
  tip: { color: 'success', title: '✓ Tip' },
  important: { color: 'merged', title: '◆ Important' },
  warning: { color: 'warning', title: '⚠ Warning' },
  caution: { color: 'error', title: '✕ Caution' },
}

// Code blocks the person unfolded, by message id and block index.
const expanded = atom({ plugin: 'pretty-markdown', key: 'expanded' } as const, [] as readonly FoldId[])

// shortcut: counts one cell per character, so wide glyphs (CJK, emoji) misalign
// a column; measure display width if tables with them show up.
const widthOf = (list: Span[]) =>
  list.reduce((n, s) => n + (s.kind === 'code' ? s.text.length + 2 : s.kind === 'link' ? s.label.length : s.text.length), 0)

const JUSTIFY: Record<Align, 'flex-start' | 'center' | 'flex-end'> = { left: 'flex-start', center: 'center', right: 'flex-end' }

type Indexed = Part & { i: number }

// Pairs each heading with the part under it, so the two draw without a gap.
function sections(parts: Part[]): [Indexed | undefined, Indexed | undefined][] {
  const out: [Indexed | undefined, Indexed | undefined][] = []
  const list = parts.map((p, i) => ({ ...p, i }) as Indexed)
  for (let k = 0; k < list.length; k++) {
    const p = list[k]!
    if (p.kind !== 'heading') out.push([undefined, p])
    else if (list[k + 1] && list[k + 1]!.kind !== 'heading') out.push([p, list[++k]])
    else out.push([p, undefined])
  }
  return out
}

export const register: Register = on => {
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const parts = parse(e.props.text)
    const isPlain = parts.every(p => p.kind === 'markdown')
    if (isPlain) return next(e)

    const { Box, Text, Code, Markdown, Link, Button } = $.ui.resolve(e)
    const open = await read($, expanded)
    const room = (e.viewport?.columns ?? 100) - 4

    const spans = (list: Span[], at: string) =>
      list.map((s, k) =>
        s.kind === 'code' ? (
          <Text key={`${at}.${k}`} backgroundColor={CHIP_BG} color={CHIP_FG}>{` ${s.text} `}</Text>
        ) : s.kind === 'link' ? (
          <Link key={`${at}.${k}`} href={s.href} label={s.label} />
        ) : (
          <Text key={`${at}.${k}`} weight={s.bold ? 'bold' : undefined} italic={s.italic}>{s.text}</Text>
        ),
      )

    const lines = (list: Line[], at: string) =>
      list.map((line, j) => (
        <Text key={`${at}.${j}`} weight={line.isHeading ? 'bold' : undefined}>
          {line.prefix}
          {spans(line.spans, `${at}.${j}`)}
        </Text>
      ))

    const draw = (part: Indexed) => {
      const i = part.i

      if (part.kind === 'markdown') return <Markdown key={`m${i}`} text={part.text} />

      if (part.kind === 'heading') {
        return (
          <Box key={`h${i}`} flexDirection="column">
            <Text color="claude" weight="bold">{spans(part.spans, `h${i}`)}</Text>
            <Text dimColor>{'─'.repeat(Math.min(room, widthOf(part.spans)))}</Text>
          </Box>
        )
      }

      if (part.kind === 'table') {
        const widths = part.header.map((h, k) =>
          Math.max(widthOf(h), ...part.rows.map(r => widthOf(r[k] ?? []))))
        // Too wide: take the overflow from the widest columns, whose cells then
        // wrap; the engine's own table is the fallback only when that can't fit.
        const MIN_COL = 12
        let over = widths.reduce((a, b) => a + b, 0) + 3 * (widths.length - 1) + 4 - room
        while (over > 0) {
          const k = widths.indexOf(Math.max(...widths))
          if (widths[k]! <= MIN_COL) break
          const cut = Math.min(over, widths[k]! - MIN_COL)
          widths[k] = widths[k]! - cut
          over -= cut
        }
        if (over > 0) return <Markdown key={`t${i}`} text={part.source} />
        const row = (cells: Span[][], at: string, isHead: boolean) => (
          <Box key={at} flexDirection="row">
            {cells.map((cell, k) => (
              <Box key={`${at}.${k}`} flexDirection="row">
                {k > 0 ? <Text dimColor>{' │ '}</Text> : null}
                <Box width={widths[k]} flexShrink={0} justifyContent={JUSTIFY[part.align[k] ?? 'left']}>
                  <Text color={isHead ? 'claude' : undefined} weight={isHead ? 'bold' : undefined}>
                    {spans(cell, `${at}.${k}`)}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        )
        return (
          <Box key={`t${i}`} flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1} alignSelf="flex-start">
            {row(part.header, `t${i}.h`, true)}
            <Text dimColor>{widths.map(w => '─'.repeat(w)).join('─┼─')}</Text>
            {part.rows.map((r, j) => row(r, `t${i}.${j}`, false))}
          </Box>
        )
      }

      if (part.kind === 'next') {
        return (
          <Box key={`n${i}`} borderStyle="round" borderColor="claude" paddingX={1}>
            <Text>
              <Text color="claude" weight="bold">{'→ Next  '}</Text>
              {spans(part.spans, `n${i}`)}
            </Text>
          </Box>
        )
      }

      if (part.kind === 'callout') {
        const style = CALLOUT[part.type]
        return (
          <Box key={`a${i}`} flexDirection="column" borderStyle="round" borderColor={style.color} paddingX={1}>
            <Text color={style.color} weight="bold">{style.title}</Text>
            {lines(part.lines, `a${i}`)}
          </Box>
        )
      }

      if (part.kind === 'code') {
        const isDiff = part.language === 'diff' || part.language === 'patch'
        const all = part.source.split('\n')
        const foldId = `${e.requestId}:${i}`
        const isFolded = all.length > FOLD_OVER && !open.includes(foldId)
        const shown = isFolded ? all.slice(0, FOLD_TO).join('\n') : part.source
        return (
          <Box key={`c${i}`} flexDirection="column" borderStyle="round" borderColor="subtle" paddingX={1}>
            <Box flexDirection="row" justifyContent="space-between">
              <Text dimColor italic>{part.language}</Text>
              <Button
                key={`copy${i}`}
                label="⧉ copy"
                plain
                dimColor
                onPress={async press => {
                  const { isCopied } = await $.ui.copy({ text: part.source, surface: press.surface })
                  $.ui.toast(isCopied ? 'Copied to clipboard' : 'Copy failed')
                }}
              />
            </Box>
            {isDiff ? (
              <Code source={asHunk(part.source)} format="diff" />
            ) : (
              <Code
                source={shown}
                language={part.language || undefined}
                startLine={all.length > NUMBER_OVER ? 1 : undefined}
              />
            )}
            {all.length > FOLD_OVER && !isDiff ? (
              <Button
                key={`fold${i}`}
                label={isFolded ? `▾ show all ${all.length} lines` : '▴ fold'}
                plain
                dimColor
                onPress={() =>
                  update($, expanded, ids =>
                    ids.includes(foldId) ? ids.filter(id => id !== foldId) : [...ids, foldId],
                  )
                }
              />
            ) : null}
          </Box>
        )
      }

      return (
        <Box key={`l${i}`} flexDirection="column">
          {lines(part.lines, `l${i}`)}
        </Box>
      )
    }

    // A tree of our own replaces the engine's row, bullet and indent included.
    return (
      <Box flexDirection="row">
      <Box width={2} flexShrink={0}>
        <Text>{e.props.isFirstOfReply ? '●' : ' '}</Text>
      </Box>
      <Box flexDirection="column" gap={1} flexGrow={1} flexShrink={1}>
        {sections(parts).map(([head, body]) =>
          head === undefined ? draw(body!) : (
            <Box key={`s${head.i}`} flexDirection="column">
              {draw(head)}
              {body ? draw(body) : null}
            </Box>
          ),
        )}
      </Box>
      </Box>
    )
  })
}
