import { expect, test } from 'claude-code/testing'

test('inline code draws as a padded chip', async $ => {
  const ui = await $.ui.mount({
    plugin: 'pretty-markdown',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: { text: 'Edit `a.ts` now', isFirstOfReply: true },
  })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts).toContain(' a.ts ')
})

test('the copy button puts the block source on the clipboard', async ($, on) => {
  const copied: string[] = []
  on('ui.copy', (_, e) => {
    copied.push(e.text)
    return { value: { isCopied: true } }
  })
  const ui = await $.ui.mount({
    plugin: 'pretty-markdown',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: { text: '```bash\nnpm test\n```', isFirstOfReply: true },
  })
  await ui.press({ key: 'copy0' })
  expect(copied).toEqual(['npm test'])
})
