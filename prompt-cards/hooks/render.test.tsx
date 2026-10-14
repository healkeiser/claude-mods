import { expect, test } from 'claude-code/testing'

const props = (kind: string, text = 'fix the band') => ({ text, origin: { kind }, isExpanded: false }) as never

test('a typed prompt draws as a card with a label', async $ => {
  const ui = await $.ui.mount({ plugin: 'prompt-cards', surface: 'terminal', component: 'UserMessage', props: props('composer') })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts).toEqual(['you', 'fix the band'])
})

test('the prompts pane lists drawn prompts newest first', async $ => {
  await $.ui.mount({ plugin: 'prompt-cards', surface: 'terminal', component: 'UserMessage', requestId: 'm1', props: props('composer', 'first ask') })
  await $.ui.mount({ plugin: 'prompt-cards', surface: 'terminal', component: 'UserMessage', requestId: 'm2', props: props('composer', 'second ask\nmore') })
  const pane = await $.ui.mount({ plugin: 'prompt-cards', surface: 'terminal', component: 'Pane', requestId: 'prompts', props: { bodyColumns: 60 } as never })
  expect((await pane.findAll({ type: 'Button' })).map(b => b.text)).toEqual(['#2 second ask', '#1 first ask'])
})

test('a task notification keeps the engine drawing', async ($, on) => {
  // Stands in for the engine's own row beneath the plugin.
  on('ui.render', { component: 'UserMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine row</Text>
  })
  const ui = await $.ui.mount({ plugin: 'prompt-cards', surface: 'terminal', component: 'UserMessage', props: props('task-notification') })
  expect((await ui.findAll({ type: 'Text' })).map(t => t.text)).toEqual(['engine row'])
})

test('a fenced block in a prompt draws as code, the prose around it as text', async $ => {
  const text = 'look:\n```ts\nconst a = 1\n```\ndone'
  const ui = await $.ui.mount({ plugin: 'prompt-cards', surface: 'terminal', component: 'UserMessage', props: props('composer', text) })
  const texts = (await ui.findAll({ type: 'Text' })).map(t => t.text)
  expect(texts).toContain('look:')
  expect(texts).toContain('ts')
  expect(texts).toContain('done')
  expect(texts.some(t => t.includes('```'))).toBe(false)
})
