import { test, expect } from './mind-elixir-test'

const nodeTypes = {
  module: { className: 'm-node-module', title: '类别' },
  subModule: { className: 'm-node-subModule', title: '子类' },
  example: { className: 'm-node-example', title: '用例' },
  step: { className: 'm-node-step', title: '步骤' },
  expect: { className: 'm-node-expect', title: '期望' },
  expr: { className: 'm-node-expr', title: '语句' },
  comment: { className: 'm-node-comment', title: '注释' },
}

const data = {
  nodeData: {
    id: 'me-root',
    topic: 'Mind Elixir',
    children: [
      {
        topic: 'What is Mind Elixir',
        id: 'bd4313fbac40284b',
        type: 'module',
        children: [
          {
            topic: 'A mind map core',
            id: 'beeb823afd6d2114',
            type: 'subModule',
          },
          {
            topic: 'Free',
            id: 'c1f068377de9f3a0',
            type: 'subModule',
          },
          {
            topic: 'Open-Source',
            id: 'c1f06d38a09f23ca',
            type: 'subModule',
          },
        ],
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data, '#map', { nodeTypes })
})

test('Node Type Selection', async ({ page, me }) => {
  const nodeWithType = page.locator('#map me-tpc:has-text("What is Mind Elixir")')
  await expect(nodeWithType).toBeVisible()

  const typeBadge = nodeWithType.locator('.me-node-type')
  await expect(typeBadge).toBeVisible()
  await expect(typeBadge).toHaveText('类别')

  await typeBadge.scrollIntoViewIfNeeded()
  await typeBadge.dispatchEvent('click')

  const typeSelectBox = page.locator('#type-select-box')
  await expect(typeSelectBox).toBeVisible()

  const subModuleOption = typeSelectBox.locator('.me-node-type-item:has-text("子类")')
  await expect(subModuleOption).toBeVisible()
  await subModuleOption.dispatchEvent('click')

  await expect(typeSelectBox).toBeHidden()
  await expect(typeBadge).toHaveText('子类')
  await expect(typeBadge).toHaveClass(/m-node-subModule/)
})

test('New Node Type Selection', async ({ page, me }) => {
  const rootNode = page.locator('#map me-root > me-tpc')
  await rootNode.click()

  await page.keyboard.press('Tab')

  const typeSelectBox = page.locator('#type-select-box')
  await expect(typeSelectBox).toBeVisible()

  const exampleOption = typeSelectBox.locator('.me-node-type-item:has-text("用例")')
  await exampleOption.dispatchEvent('click')

  await expect(typeSelectBox).toBeHidden()

  const inputBox = page.locator('#input-box')
  await expect(inputBox).toBeVisible()

  await inputBox.fill('My New Feature')
  await page.keyboard.press('Enter')

  const newNode = page.locator('#map me-tpc:has-text("My New Feature")')
  await expect(newNode).toBeVisible()

  const newTypeBadge = newNode.locator('.me-node-type')
  await expect(newTypeBadge).toBeVisible()
  await expect(newTypeBadge).toHaveText('用例')
  await expect(newTypeBadge).toHaveClass(/m-node-example/)
})

test('Type Select Keyboard Navigation', async ({ page, me }) => {
  const nodeWithType = page.locator('#map me-tpc:has-text("What is Mind Elixir")')
  await expect(nodeWithType).toBeVisible()
  const typeBadge = nodeWithType.locator('.me-node-type')
  await typeBadge.dispatchEvent('click')

  const typeSelectBox = page.locator('#type-select-box')
  await expect(typeSelectBox).toBeVisible()

  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')

  // Verify selection box closed and type changed
  await expect(typeSelectBox).toBeHidden()
  await expect(typeBadge).toHaveText('子类')
})

test('Type Select Arrow Keys and Esc', async ({ page, me }) => {
  const rootNode = page.locator('#map me-root > me-tpc')
  await rootNode.click()
  await page.keyboard.press('Enter')

  const typeSelectBox = page.locator('#type-select-box')
  await expect(typeSelectBox).toBeVisible()

  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Enter')
  await expect(typeSelectBox).toBeHidden()

  const selectedNode = page.locator('#map me-tpc.selected')
  const badge = selectedNode.locator('.me-node-type')
  await expect(badge).toBeVisible()

  await badge.dispatchEvent('click')
  const box2 = page.locator('#type-select-box')
  await expect(box2).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(box2).toBeHidden()

  const inputBox = page.locator('#input-box')
  await expect(inputBox).toBeHidden()
})
test('Insert Sibling Node Type Selection', async ({ page, me }) => {
  const rootNode = page.locator('#map me-root > me-tpc')
  await rootNode.click()

  const childNode = page.locator('#map me-tpc:has-text("What is Mind Elixir")')
  await childNode.scrollIntoViewIfNeeded()
  await childNode.dispatchEvent('click')

  await page.keyboard.press('Enter')

  const typeSelectBox = page.locator('#type-select-box')
  await expect(typeSelectBox).toBeVisible()

  const stepOption = typeSelectBox.locator('.me-node-type-item:has-text("步骤")')
  await stepOption.dispatchEvent('click')

  await expect(typeSelectBox).toBeHidden()

  const inputBox = page.locator('#input-box')
  await expect(inputBox).toBeVisible()

  await inputBox.fill('My Sibling Node')
  await page.keyboard.press('Enter')

  const newNode = page.locator('#map me-tpc:has-text("My Sibling Node")')
  await expect(newNode).toBeVisible()

  const newTypeBadge = newNode.locator('.me-node-type')
  await expect(newTypeBadge).toBeVisible()
  await expect(newTypeBadge).toHaveText('步骤')
  await expect(newTypeBadge).toHaveClass(/m-node-step/)
})

test('Render Node Types', async ({ page, me }) => {
  const rootChild = page.locator('#map me-tpc:has-text("What is Mind Elixir")')
  await expect(rootChild.locator('.me-node-type')).toHaveText('类别')
  await expect(rootChild.locator('.me-node-type')).toHaveClass(/m-node-module/)

  const subNode1 = page.locator('#map me-tpc:has-text("A mind map core")')
  await expect(subNode1.locator('.me-node-type')).toHaveText('子类')
  await expect(subNode1.locator('.me-node-type')).toHaveClass(/m-node-subModule/)

  const subNode2 = page.locator('#map me-tpc:has-text("Free")')
  await expect(subNode2.locator('.me-node-type')).toHaveText('子类')
  await expect(subNode2.locator('.me-node-type')).toHaveClass(/m-node-subModule/)
})

test('Input Box Position Below Type Badge', async ({ page, me }) => {
  const rootNode = page.locator('#map me-root > me-tpc')
  await rootNode.click()

  await page.keyboard.press('Tab')

  const typeSelectBox = page.locator('#type-select-box')
  await expect(typeSelectBox).toBeVisible()

  const exampleOption = typeSelectBox.locator('.me-node-type-item:has-text("用例")')
  await exampleOption.dispatchEvent('click')

  await expect(typeSelectBox).toBeHidden()

  const inputBox = page.locator('#input-box')
  const typeBadge = page.locator('#map me-tpc.selected .me-node-type')
  const inputBoxBox = await inputBox.boundingBox()
  const typeBadgeBox = await typeBadge.boundingBox()

  expect(inputBoxBox && typeBadgeBox && inputBoxBox.y >= typeBadgeBox.y + typeBadgeBox.height - 1).toBeTruthy()
})
