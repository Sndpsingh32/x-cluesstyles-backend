import { z } from 'zod';

/**
 * Design Studio configuration
 * ---------------------------
 * A single editable document that drives the storefront design studio
 * (colour shades, print areas + specifications per category, printing
 * methods, fonts, the artwork library and recent names).
 *
 * The shape is intentionally permissive — the studio reads it as a partial
 * override of its built-in defaults, so any subset of keys is valid.
 */
const json = z.any();

export const saveStudioConfigSchema = z
  .object({
    title: json.optional(),
    toolbar: json.optional(),
    rail: json.optional(),
    panels: json.optional(),
    stage: json.optional(),
    side: json.optional(),
    dialogs: json.optional(),
    shades: json.optional(),
    categories: json.optional(),
    families: json.optional(),
    fonts: json.optional(),
    art: json.optional(),
    recentNames: json.optional(),
    printing: json.optional(),
  })
  .passthrough();
