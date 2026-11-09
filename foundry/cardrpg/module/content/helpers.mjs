/**
 * The one shared shorthand the content tables use.
 *
 * It lived at the top of content.mjs when content.mjs was one file. It is here rather than copied
 * into each table because a second copy of a helper is a second helper, and these tables are the
 * part of the system most often edited by hand.
 */
export const verb = (value, extra = {}) => ({ value, ...extra });
