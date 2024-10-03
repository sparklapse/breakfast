/**
 * Since OBS source names are required to be unique, we need to do some tricks to try and reduce
 * the potential for issues when it comes to creating and manipulating sources in OBS.
 *
 * Special thanks to https://github.com/flopp/invisible-characters for providing such a
 * comprehensive list
 */

import { random } from "nanoid";

/**
 * Soft Hyphen
 * The invis prefix is only invisible when a character follows the character.
 */
const INVIS_PREFIX = "\u00AD";

const INVISIBLE_CHARACTERS = {
  COMBINING_GRAPHEME_JOINER: "\u034F",
  ARABIC_LETTER_MARK: "\u061C",
  ZERO_WIDTH_SPACE: "\u200B",
  ZERO_WIDTH_NONJOINER: "\u200C",
  ZERO_WIDTH_JOINER: "\u200D",
  INVISIBLE_TIMES: "\u2062",
  INVISIBLE_SEPARATOR: "\u2063",
  INVISIBLE_PLUS: "\u2064",
  TAG_LATIN_CAPITAL_LETTER_A: "\u{E0041}",
  TAG_LATIN_CAPITAL_LETTER_B: "\u{E0042}",
  TAG_LATIN_CAPITAL_LETTER_C: "\u{E0043}",
  TAG_LATIN_CAPITAL_LETTER_D: "\u{E0044}",
  TAG_LATIN_CAPITAL_LETTER_E: "\u{E0045}",
  TAG_LATIN_CAPITAL_LETTER_F: "\u{E0046}",
  TAG_LATIN_CAPITAL_LETTER_G: "\u{E0047}",
  TAG_LATIN_CAPITAL_LETTER_H: "\u{E0048}",
  TAG_LATIN_CAPITAL_LETTER_I: "\u{E0049}",
  TAG_LATIN_CAPITAL_LETTER_J: "\u{E004A}",
  TAG_LATIN_CAPITAL_LETTER_K: "\u{E004B}",
  TAG_LATIN_CAPITAL_LETTER_L: "\u{E004C}",
  TAG_LATIN_CAPITAL_LETTER_M: "\u{E004D}",
  TAG_LATIN_CAPITAL_LETTER_N: "\u{E004E}",
  TAG_LATIN_CAPITAL_LETTER_O: "\u{E004F}",
  TAG_LATIN_CAPITAL_LETTER_P: "\u{E0050}",
  TAG_LATIN_CAPITAL_LETTER_Q: "\u{E0051}",
  TAG_LATIN_CAPITAL_LETTER_R: "\u{E0052}",
  TAG_LATIN_CAPITAL_LETTER_S: "\u{E0053}",
  TAG_LATIN_CAPITAL_LETTER_T: "\u{E0054}",
  TAG_LATIN_CAPITAL_LETTER_U: "\u{E0055}",
  TAG_LATIN_CAPITAL_LETTER_V: "\u{E0056}",
  TAG_LATIN_CAPITAL_LETTER_W: "\u{E0057}",
  TAG_LATIN_CAPITAL_LETTER_X: "\u{E0058}",
  TAG_LATIN_CAPITAL_LETTER_Y: "\u{E0059}",
  TAG_LATIN_CAPITAL_LETTER_Z: "\u{E005A}",
};

const INVIS_ID_CHARS = Object.values(INVISIBLE_CHARACTERS);

// Original implementation made by nanoid
// https://github.com/ai/nanoid/blob/main/index.js
const createInvisGenerator = (size = 21) => {
  const mask = (2 << (31 - Math.clz32((INVIS_ID_CHARS.length - 1) | 1))) - 1;
  const step = Math.ceil((1.6 * mask * size) / INVIS_ID_CHARS.length);

  return () => {
    let id = "";
    /**
     * We need to manually count the length since some of the unicode characters
     * are treated as 2 length characters.
     */
    let length = 0;
    while (true) {
      let bytes = random(step);
      let i = step;
      while (i--) {
        // Try pull a random character, and if successful append to id
        const char = INVIS_ID_CHARS[bytes[i] & mask];
        if (char !== undefined) id += char;
        else continue;

        // Manually increment length and return if we've reached the desired length
        length += 1;
        if (length >= size) return id;
      }
    }
  };
};

/**
 * ## Invis ID Generator
 *
 * Generate an ID from invisible characters to where it takes up no display space.
 */
export const invisId = createInvisGenerator();

/**
 * ## Devis
 *
 * Remove known invisible ID characters from a string
 *
 * @param input The string with suspected invisible characters
 * @returns The input with known invisible characters removed
 */
export const devisId = (input: string): string => {
  let cleaned = "";
  for (const char of input) {
    if (INVIS_ID_CHARS.includes(char)) continue;
    cleaned += char;
  }
  return cleaned;
};

/**
 * ## Invis Prefix
 *
 * Prefix a string with an invisible character.
 *
 * @param input
 * @returns
 */
export const invisPrefix = (input: string): string => {
  return `${INVIS_PREFIX}${input}`;
};

/**
 * ## Devis Prefix
 *
 * Remove an invisible prefix from a string.
 *
 * @param input
 * @returns
 */
export const devisPrefix = (input: string): string => {
  if (input.startsWith(INVIS_PREFIX)) return input.slice(1);
  return input;
};
