import { en, type Strings } from './en';

/**
 * Single string table for now. Adding a language = add a file with the same shape
 * and switch on the settings locale here. Screens only ever import `t`.
 */
export const t: Strings = en;
export type { Strings };
