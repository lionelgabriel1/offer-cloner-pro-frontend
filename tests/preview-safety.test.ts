import { describe, expect, it } from 'vitest'
import { isSafePreviewCssValue, safePreviewUrl } from '../lib/preview-safety'

describe('safePreviewUrl', () => {
  it.each([
    ['https://example.com/image.png', 'https://example.com/image.png'],
    ['/assets/image.png', '/assets/image.png'],
    ['#section', '#section'],
  ])('permite URL segura %s', (input, expected) => {
    expect(safePreviewUrl(input)).toBe(expected)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    '//tracker.example/pixel',
    'https://example.com/\nattack',
    'https://example.com/\\evil',
    '',
    'x'.repeat(4097),
  ])('rejeita URL perigosa %s', (input) => {
    expect(safePreviewUrl(input)).toBeUndefined()
  })
})

describe('isSafePreviewCssValue', () => {
  it.each(['#fff', '16px', '1px solid #ddd', 'center', 'column', 'linear-gradient(#fff, #eee)'])('permite valor CSS inerte %s', (input) => {
    expect(isSafePreviewCssValue(input)).toBe(true)
  })

  it.each([
    'url(https://tracker.example/x)',
    'expression(alert(1))',
    'javascript:alert(1)',
    '@import url(https://tracker.example/x)',
    'behavior: url(x)',
    'red; background: url(x)',
    '<script>',
    'x'.repeat(161),
  ])('rejeita valor CSS executável/remoto %s', (input) => {
    expect(isSafePreviewCssValue(input)).toBe(false)
  })
})
