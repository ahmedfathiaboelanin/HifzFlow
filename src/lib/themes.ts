// The 5 theme palettes. Colors live as CSS vars in index.css;
// this file carries the labels + swatch colors for the pickers.
import type { Palette } from './types';

export interface PaletteInfo {
  id: Palette;
  name: string;
  swatch: string;
  description: string;
}

export const PALETTES: PaletteInfo[] = [
  { id: 'sage', name: 'المريمية', swatch: '#2f7d5b', description: 'الأخضر الهادئ الأصلي' },
  { id: 'ocean', name: 'المحيط', swatch: '#0e7490', description: 'أزرق مخضرّ' },
  { id: 'desert', name: 'الصحراء', swatch: '#926020', description: 'كهرماني دافئ' },
  { id: 'rose', name: 'الورد', swatch: '#be185d', description: 'وردي هادئ' },
  { id: 'night', name: 'الليل', swatch: '#6366f1', description: 'نيلي ليلي' },
];

/** Resolve the effective color mode (system follows the OS preference). */
export function resolveMode(mode: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}
