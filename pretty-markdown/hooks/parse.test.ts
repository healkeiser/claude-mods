import { expect, test } from 'claude-code/testing'

import { parse, parseInline } from './parse'

test('fences become code parts with their language', () => {
  const parts = parse('Run this:\n\n```bash\nnpm test\n```\n\nDone.')
  expect(parts).toEqual([
    { kind: 'markdown', text: 'Run this:' },
    { kind: 'code', language: 'bash', source: 'npm test' },
    { kind: 'markdown', text: 'Done.' },
  ])
})

test('inline code, bold and links split into spans', () => {
  expect(parseInline('Edit `a.ts` **now**, see [docs](https://x.io)')).toEqual([
    { kind: 'text', text: 'Edit ' },
    { kind: 'code', text: 'a.ts' },
    { kind: 'text', text: ' ' },
    { kind: 'text', text: 'now', bold: true },
    { kind: 'text', text: ', see ' },
    { kind: 'link', label: 'docs', href: 'https://x.io' },
  ])
})

test('tables parse into header, rows and alignment', () => {
  const [part] = parse('| a | b |\n|---|--:|\n| `x` | y |')
  expect(part?.kind === 'table' && part.align).toEqual(['left', 'right'])
  expect(part?.kind === 'table' && part.rows[0]![0]).toEqual([{ kind: 'code', text: 'x' }])
})

test('a bold line opens a heading over the lines under it', () => {
  const parts = parse('**What changed:**\n- one\n- two')
  expect(parts.map(p => p.kind)).toEqual(['heading', 'markdown'])
})

test('list items keep their marker', () => {
  const [part] = parse('- run `ls`\n2. then `cd`')
  expect(part?.kind === 'lines' && part.lines.map(l => l.prefix)).toEqual(['• ', '2. '])
})
