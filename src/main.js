const input = document.getElementById('tailwind-class');
const output = document.getElementById('output');
const outputLabel = document.getElementById('output-label');
const copyButton = document.getElementById('copy-button');
const copyFeedback = document.getElementById('copy-feedback');

// --- Conversion Mappings ---
const keywordMap = new Map([
  ['w-full', 'double.infinity'],
  ['h-full', 'double.infinity'],
  ['w-screen', 'MediaQuery.of(context).size.width'],
  ['h-screen', 'MediaQuery.of(context).size.height'],
]);

const radiusMap = new Map([
  ['sm', 4.0], ['rounded', 6.0], ['md', 8.0], ['lg', 12.0],
  ['xl', 16.0], ['2xl', 24.0], ['3xl', 32.0], ['full', 'BoxShape.circle'],
]);

const sizeMap = new Map([
  ['xs', 320.0], ['sm', 384.0], ['md', 448.0], ['lg', 512.0],
  ['xl', 576.0], ['2xl', 672.0], ['3xl', 768.0], ['4xl', 896.0],
  ['5xl', 1024.0], ['6xl', 1152.0], ['7xl', 1280.0],
  ['full', 'double.infinity'],
  ['screen', 'MediaQuery.of(context).size'], // For constraints
]);

/**
 * Parses a single Tailwind class into a structured object.
 * @param {string} className - The Tailwind CSS class.
 * @returns {object|null} A structured object or null if invalid.
 */
function parseSingleClass(className) {
  const trimmedClass = className.trim().toLowerCase();
  if (!trimmedClass) return null;

  // Check for a full keyword match first (e.g., 'w-full')
  if (keywordMap.has(trimmedClass)) {
    return { type: 'other', value: keywordMap.get(trimmedClass) };
  }

  const parts = trimmedClass.split('-');
  const prefix = parts[0];
  const value = parts.slice(1).join('-');

  // 0. Handle Borders (e.g., border, border-2, border-x, border-l-4, border-0, border-[3px])
  if (prefix === 'border') {
    // Determine sides, default all
    let sides = ['top', 'right', 'bottom', 'left'];
    let widthStr = null;

    if (parts.length === 1) {
      // 'border'
      widthStr = '1';
    } else if (parts.length >= 2) {
      const sideOrWidth = parts[1];
      const sideMap = {
        t: ['top'],
        r: ['right'],
        b: ['bottom'],
        l: ['left'],
        x: ['left', 'right'],
        y: ['top', 'bottom'],
      };

      if (sideMap[sideOrWidth]) {
        sides = sideMap[sideOrWidth];
        widthStr = parts[2] ?? '1';
      } else {
        // No side specified, treat second part as width for all sides
        sides = ['top', 'right', 'bottom', 'left'];
        widthStr = sideOrWidth;
      }
    }

    // Normalize width (Tailwind border widths are in px; default is 1)
    let width = 1;
    if (widthStr) {
      const arbitrary = widthStr.match(/^\[(.+)\]$/); // [3px]
      if (arbitrary) {
        const raw = arbitrary[1];
        const pxMatch = raw.match(/([0-9]*\.?[0-9]+)px/);
        if (pxMatch) {
          width = parseFloat(pxMatch[1]);
        } else if (!isNaN(parseFloat(raw))) {
          width = parseFloat(raw);
        }
      } else if (!isNaN(parseFloat(widthStr))) {
        width = parseFloat(widthStr);
      } else if (widthStr === '0') {
        width = 0;
      }
    }

    return { type: 'border', sides, width };
  }

  // 1. Handle Constraints (max-w, min-h, etc.)
  if ((prefix === 'max' || prefix === 'min') && parts.length > 1) {
    const constraintType = parts[1] === 'w' ? 'Width' : 'Height';
    const constraintKey = prefix + constraintType; // e.g., maxWidth, minHeight
    const sizeValue = parts.slice(2).join('-');

    if (sizeMap.has(sizeValue)) {
      let finalValue = sizeMap.get(sizeValue);
      if (finalValue === 'MediaQuery.of(context).size') {
        finalValue = `MediaQuery.of(context).size.${constraintType.toLowerCase()}`;
      }
      return { type: 'constraint', key: constraintKey, value: finalValue };
    }
    if (!isNaN(parseFloat(sizeValue))) {
      return { type: 'constraint', key: constraintKey, value: parseFloat(sizeValue) * 4 };
    }
  }

  // 2. Handle Radius
  if (prefix === 'rounded') {
    const radiusKey = value || 'rounded'; // default 'rounded'
    if (radiusMap.has(radiusKey)) {
      return { type: 'radius', value: radiusMap.get(radiusKey) };
    }
  }

  // 3. Handle Spacing, Width, Height, Gap (numeric)
  const numericValue = parts[parts.length - 1];
  if (numericValue === 'px') return { type: 'spacing', value: 1.0 };

  const fractionMatch = numericValue.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]);
    const den = parseFloat(fractionMatch[2]);
    return den !== 0 ? { type: 'other', value: `'${((num / den) * 100).toFixed(0)}%'` } : null;
  }

  if (!isNaN(parseFloat(numericValue))) {
    return { type: 'spacing', value: parseFloat(numericValue) * 4 };
  }

  return null;
}

/**
 * Formats a raw JS value into a Flutter-compatible string.
 */
function formatValue(val) {
  if (typeof val === 'number') return val.toFixed(1);
  return val; // It's already a string like 'double.infinity' or "'50%'"
}

// --- Main Event Listener ---
input.addEventListener('input', (e) => {
  const inputValue = e.target.value.trim();
  const classNames = inputValue.split(/\s+/).filter(c => c);
  const parsedObjects = classNames.map(parseSingleClass).filter(o => o !== null);

  const constraints = {};
  const otherValues = [];
  const borderTokens = [];

  parsedObjects.forEach(obj => {
    if (obj.type === 'constraint') {
      constraints[obj.key] = obj.value;
    } else if (obj.type === 'border') {
      borderTokens.push(obj);
    } else {
      otherValues.push(formatValue(obj.value));
    }
  });

  const finalResults = [];
  if (Object.keys(constraints).length > 0) {
    const constraintPairs = Object.entries(constraints).map(([key, value]) => `${key}: ${formatValue(value)}`);
    finalResults.push(`BoxConstraints(${constraintPairs.join(', ')})`);
  }

  // Compose a single Flutter Border expression from all border tokens
  if (borderTokens.length > 0) {
    const sides = { top: undefined, right: undefined, bottom: undefined, left: undefined };
    // Later tokens override earlier ones
    borderTokens.forEach(tok => {
      tok.sides.forEach(side => {
        sides[side] = tok.width;
      });
    });

    const allDefined = ['top', 'right', 'bottom', 'left'].every(k => typeof sides[k] === 'number');
    if (allDefined && sides.top === sides.right && sides.right === sides.bottom && sides.bottom === sides.left) {
      finalResults.push(`Border.all(width: ${sides.top.toFixed(1)})`);
    } else {
      const borderParts = [];
      if (typeof sides.top === 'number') borderParts.push(`top: BorderSide(width: ${sides.top.toFixed(1)})`);
      if (typeof sides.right === 'number') borderParts.push(`right: BorderSide(width: ${sides.right.toFixed(1)})`);
      if (typeof sides.bottom === 'number') borderParts.push(`bottom: BorderSide(width: ${sides.bottom.toFixed(1)})`);
      if (typeof sides.left === 'number') borderParts.push(`left: BorderSide(width: ${sides.left.toFixed(1)})`);
      if (borderParts.length > 0) {
        finalResults.push(`Border(${borderParts.join(', ')})`);
      }
    }
  }
  finalResults.push(...otherValues);

  let resultString;
  if (finalResults.length === 0) {
    resultString = '0.0';
    outputLabel.textContent = 'Flutter Value';
    copyButton.classList.add('opacity-25', 'pointer-events-none');
  } else if (finalResults.length === 1) {
    resultString = finalResults[0];
    outputLabel.textContent = 'Flutter Value / Object';
    copyButton.classList.remove('opacity-25', 'pointer-events-none');
  } else {
    resultString = `[${finalResults.join(', ')}]`;
    outputLabel.textContent = 'Flutter List<dynamic>';
    copyButton.classList.remove('opacity-25', 'pointer-events-none');
  }

  if (finalResults.length === 0) {
    copyButton.classList.add('opacity-25', 'pointer-events-none');
  }

  output.textContent = resultString;
});

copyButton.addEventListener('click', async () => {
  const textToCopy = output.textContent;
  const showCopied = () => {
    copyFeedback.classList.remove('opacity-0');
    setTimeout(() => { copyFeedback.classList.add('opacity-0'); }, 1500);
  };

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(textToCopy);
      showCopied();
      return;
    } catch (err) {
      console.error('Clipboard API failed; falling back.', err);
    }
  }

  // Fallback for non-secure contexts
  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = textToCopy;
  tempTextArea.style.position = 'fixed';
  tempTextArea.style.top = '0';
  tempTextArea.style.left = '0';
  tempTextArea.style.opacity = '0';
  document.body.appendChild(tempTextArea);
  tempTextArea.focus();
  tempTextArea.select();
  try {
    const ok = document.execCommand('copy');
    if (ok) showCopied();
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }
  document.body.removeChild(tempTextArea);
});

input.dispatchEvent(new Event('input'));

