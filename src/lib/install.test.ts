import { describe, expect, it } from 'vitest'
import { detectPlatform } from './install'

describe('detectPlatform', () => {
  it('iPhone et iPad', () => {
    expect(
      detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Version/17.4 Mobile/15E148 Safari/604.1'),
    ).toBe('ios')
    expect(detectPlatform('Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15')).toBe('ios')
  })
  it('iPadOS qui se présente comme un Mac : seulement s’il est tactile', () => {
    const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15'
    expect(detectPlatform(mac, 5)).toBe('ios')
    expect(detectPlatform(mac, 0)).toBe('other')
  })
  it('Android', () => {
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36')).toBe('android')
  })
  it('ordinateur', () => {
    expect(detectPlatform('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36')).toBe('other')
  })
})
