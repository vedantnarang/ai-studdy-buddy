const LATEX_TO_UNICODE_MAP = {
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\theta': 'θ',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\sigma': 'σ',
  '\\phi': 'φ',
  '\\omega': 'ω',
  '\\pi': 'π',
  '\\times': '×',
  '\\cdot': '·',
  '\\pm': '±',
  '\\neq': '≠',
  '\\leq': '≤',
  '\\geq': '≥',
  '\\approx': '≈',
  '\\infty': '∞',
  '\\degree': '°',
};

const CODE_BLOCK_REGEX = /(```[\s\S]*?```)/g;
const INLINE_CODE_REGEX = /(`[^`\n]+`)/g;

const replaceLatexLikeTokens = (text) => {
  let output = text;

  // Convert common bracket delimiters used for inline/display math.
  output = output.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
  output = output.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');

  // Convert basic fractions to a readable a/b style.
  output = output.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2');

  // Convert sqrt to a readable unicode form.
  output = output.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

  // Convert common latex tokens to unicode symbols.
  Object.entries(LATEX_TO_UNICODE_MAP).forEach(([token, symbol]) => {
    output = output.replace(new RegExp(token.replace('\\', '\\\\'), 'g'), symbol);
  });

  return output;
};

const normalizeEmphasisTokens = (text) => {
  let output = text;

  // Convert markdown bold/italic into explicit HTML tags so styling persists
  // even when mixed with inline HTML like <mark> in the same paragraph.
  output = output.replace(/\*\*([^*\n][^*\n]*?)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/(^|[^\*])\*([^*\n][^*\n]*?)\*(?!\*)/g, '$1<em>$2</em>');

  return output;
};

export const formatMathForMarkdown = (input) => {
  if (!input || typeof input !== 'string') return input || '';

  // Preserve fenced and inline code blocks so code examples stay untouched.
  return input
    .split(CODE_BLOCK_REGEX)
    .map((part) => {
      if (part.startsWith('```')) return part;

      return part
        .split(INLINE_CODE_REGEX)
        .map((inlinePart) => {
          if (inlinePart.startsWith('`')) return inlinePart;
          return normalizeEmphasisTokens(replaceLatexLikeTokens(inlinePart));
        })
        .join('');
    })
    .join('');
};
