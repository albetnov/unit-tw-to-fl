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

  parsedObjects.forEach(obj => {
    if (obj.type === 'constraint') {
      constraints[obj.key] = obj.value;
    } else {
      otherValues.push(formatValue(obj.value));
    }
  });

  const finalResults = [];
  if (Object.keys(constraints).length > 0) {
    const constraintPairs = Object.entries(constraints).map(([key, value]) => `${key}: ${formatValue(value)}`);
    finalResults.push(`BoxConstraints(${constraintPairs.join(', ')})`);
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

copyButton.addEventListener('click', () => {
  const textToCopy = output.textContent;
  const tempTextArea = document.createElement('textarea');
  tempTextArea.value = textToCopy;
  document.body.appendChild(tempTextArea);
  tempTextArea.select();
  try {
    document.execCommand('copy');
    copyFeedback.classList.remove('opacity-0');
    setTimeout(() => { copyFeedback.classList.add('opacity-0'); }, 1500);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  document.body.removeChild(tempTextArea);
});

input.dispatchEvent(new Event('input'));

