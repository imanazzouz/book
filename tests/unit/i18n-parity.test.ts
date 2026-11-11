import { describe, expect, it } from 'vitest';
import ar from '@/i18n/messages/ar.json';
import en from '@/i18n/messages/en.json';
import fr from '@/i18n/messages/fr.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const entries = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      entries.set(path, value);
    } else {
      for (const [nestedKey, nestedValue] of flatten(value, path)) {
        entries.set(nestedKey, nestedValue);
      }
    }
  }
  return entries;
}

const locales = { ar, fr, en } as unknown as Record<string, Tree>;

describe('translation parity', () => {
  const arKeys = [...flatten(ar as Tree).keys()].sort();

  it.each(Object.entries(locales))('%s uses the same key set as ar', (_locale, messages) => {
    const keys = [...flatten(messages).keys()].sort();
    expect(keys).toEqual(arKeys);
  });

  it.each(Object.entries(locales))('%s has no empty strings', (_locale, messages) => {
    for (const [key, value] of flatten(messages)) {
      expect(value.trim(), `empty translation for ${key}`).not.toBe('');
    }
  });

  it('keeps ICU placeholder sets identical across locales', () => {
    const placeholders = (value: string) => [...value.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort();

    const arFlat = flatten(ar as Tree);
    for (const [key, arValue] of arFlat) {
      for (const [locale, messages] of Object.entries(locales)) {
        const value = flatten(messages).get(key);
        expect(placeholders(value ?? ''), `${locale}:${key}`).toEqual(placeholders(arValue));
      }
    }
  });
});
