import { RiTa } from "https://esm.sh/rita";

// new
const config = {
  generatedText: "",
  numOfChars: 0,
  numOfLines: 17,
  production: false,
  resetScrollersEverySeconds: 17,
  isAnimating: true,
  animationFrames: Array(17).fill(null),
  scrollSpeed: 150, // pixels per second (base speed for 100% font-size)
  fontSizeRatios: [0.33, 0.33, 0.34, 0.36, 0.38, 0.40, 0.50, 0.75, 1.0, 0.75, 0.50, 0.40, 0.38, 0.36, 0.34, 0.33, 0.33],
  letterOutline: {
    enabled: false,
    widthEm: 0.01,
    color: "black",
  },
  preJumpTransition: {
    enabled: true,
    affectedWordRatio: 0.15, // % of visible words
    holdMs: 7000, // keep altered words visible for ~s before the jump
    sizeTransitionMs: 2200, // duration of the font size transition
    largestFontScale: 1.50, // % larger than normal largest size
    smallestFontScale: 0.75, // % smaller than normal smallest size
    fallbackBaseFontVw: 4,
  },
};

function logDebug(...args) {
  if (!config.production) {
    console.log(...args);
  }
}

function applyLetterOutline(item) {
  if (config.letterOutline.enabled) {
    item.style.webkitTextStroke = `${config.letterOutline.widthEm}em ${config.letterOutline.color}`;
    item.style.textStroke = `${config.letterOutline.widthEm}em ${config.letterOutline.color}`;
  } else {
    item.style.removeProperty("-webkit-text-stroke");
    item.style.removeProperty("text-stroke");
  }
}

// newer functions
function createContent(charIndex, scroller) {
  charIndex = charIndex === -1 ? Math.floor(Math.random() * config.numOfChars) : charIndex;
  let left = 0;
  const targetWidth = scroller.clientWidth;
  let currentWidth = 0;
  let currentWordSpan = null;
  let isInWord = false;

  // Fill until width exceeds scroller width
  while (currentWidth < targetWidth) {
    const char = config.generatedText[charIndex];
    const isWhitespace = /\s/.test(char);
    
    // Check if we need to start or end a word span
    if (!isWhitespace && !isInWord) {
      // Start a new word span
      currentWordSpan = document.createElement('span');
      currentWordSpan.className = "word";
      scroller.append(currentWordSpan);
      isInWord = true;
    } else if (isWhitespace && isInWord) {
      // End the word span
      currentWordSpan = null;
      isInWord = false;
    }

    const item = createScrollItem(char, left);
    if (currentWordSpan && isInWord) {
      currentWordSpan.append(item);
    } else {
      scroller.append(item);
    }

    // Get the actual width including margin
    const itemWidth = item.offsetWidth;
    item.dataset.width = itemWidth; // Cache for animation
    left += itemWidth;
    currentWidth = left;

    // logDebug(`char: "${char}", Width: ${itemWidth}px, Total: ${currentWidth}px`);
    charIndex = (charIndex + 1) % config.numOfChars;
  }

  // Append five additional scroll items for smooth transition
  for (let j = 0; j < 5; j++) {
    const char = config.generatedText[charIndex];
    const isWhitespace = /\s/.test(char);
    
    if (!isWhitespace && !isInWord) {
      currentWordSpan = document.createElement('span');
      currentWordSpan.className = "word";
      scroller.append(currentWordSpan);
      isInWord = true;
    } else if (isWhitespace && isInWord) {
      currentWordSpan = null;
      isInWord = false;
    }

    const item = createScrollItem(char, left);
    if (currentWordSpan && isInWord) {
      currentWordSpan.append(item);
    } else {
      scroller.append(item);
    }

    const itemWidth = item.offsetWidth;
    item.dataset.width = itemWidth; // Cache for animation
    left += itemWidth;

    // logDebug(`Extra char ${j + 1}: "${char}", Width: ${itemWidth}px`);
    charIndex = (charIndex + 1) % config.numOfChars;
  }

  return charIndex;
}
function createScrollItem(char, leftPosition) {
  const item = document.createElement('span');
  item.className = "scroll-item";
  item.textContent = char;
  item.style.transform = `translateX(${leftPosition}px)`;
  applyLetterOutline(item);
  // Cache width as data attribute to avoid layout queries during animation
  item.dataset.width = '0'; // Will be updated after first render
  return item;
}
function addNewScrollItem(charIndex, scroller) {
  // Find the rightmost position of existing items
  const scrollItems = Array.from(scroller.querySelectorAll(".scroll-item"));
  let rightmostPosition = 0;

  scrollItems.forEach(item => {
    const transform = item.style.transform;
    const translateX = parseFloat(transform.match(/translateX\(([^)]+)px\)/)?.[1] || 0);
    const itemWidth = parseFloat(item.dataset.width) || 0;
    const itemRight = translateX + itemWidth;
    if (itemRight > rightmostPosition) {
      rightmostPosition = itemRight;
    }
  });

  const char = config.generatedText[charIndex];
  const isWhitespace = /\s/.test(char);
  
  // Determine if we should add to the last word span or create new one
  let targetParent = scroller;
  const children = scroller.children;
  
  if (children.length > 0) {
    const lastChild = children[children.length - 1];
    // If last child is a word span and new char is not whitespace, append to it
    if (lastChild.classList.contains("word") && !isWhitespace) {
      targetParent = lastChild;
    }
    // If last child is not a word span and new char is not whitespace, we need a new word span
    else if (!lastChild.classList.contains("word") && !isWhitespace) {
      const newWordSpan = document.createElement('span');
      newWordSpan.className = "word";
      scroller.append(newWordSpan);
      targetParent = newWordSpan;
    }
  } else if (!isWhitespace) {
    // Empty scroller, need a word span for non-whitespace
    const newWordSpan = document.createElement('span');
    newWordSpan.className = "word";
    scroller.append(newWordSpan);
    targetParent = newWordSpan;
  }

  const newItem = createScrollItem(char, rightmostPosition);
  targetParent.append(newItem);

  // Cache width after appending
  const itemWidth = newItem.offsetWidth;
  newItem.dataset.width = itemWidth;

  charIndex = (charIndex + 1) % config.numOfChars;

  return charIndex;
}

function updateScroller(scroller, charIndex, distance) {
  // Update position of each scroll item
  const itemsToRemove = [];
  const scrollItems = Array.from(scroller.querySelectorAll(".scroll-item"));

  // Batch DOM writes - use transform instead of left for GPU acceleration
  scrollItems.forEach((item, index) => {
    const transform = item.style.transform;
    const currentX = parseFloat(transform.match(/translateX\(([^)]+)px\)/)?.[1] || 0);
    const newX = currentX - distance; // Move left by distance
    item.style.transform = `translateX(${newX}px)`;

    // Check if item is completely off the left edge using cached width
    const itemWidth = parseFloat(item.dataset.width) || 0;
    if (newX + itemWidth < 0) {
      itemsToRemove.push(item);
    }
  });

  // Keep selected prejump words readable by spacing letters proportionally
  // to their current font scale, without affecting following stream layout.
  const activeWords = new Map();
  scrollItems.forEach(item => {
    const wordId = item.dataset.preJumpWordId;
    if (!wordId) return;

    const word = item.closest(".word");
    if (!word) return;

    let state = activeWords.get(wordId);
    if (!state) {
      const baseFontPx = parseFloat(word.dataset.preJumpBaseFontPx || "0") || 1;
      const currentFontPx = parseFloat(getComputedStyle(item).fontSize) || baseFontPx;
      state = {
        scale: currentFontPx / baseFontPx,
        anchorX: null,
      };
      activeWords.set(wordId, state);
    }

    if (item.dataset.preJumpWordAnchor === "1") {
      state.anchorX = getTranslateX(item);
    }
  });

  if (activeWords.size > 0) {
    scrollItems.forEach(item => {
      const wordId = item.dataset.preJumpWordId;
      if (!wordId) return;

      const state = activeWords.get(wordId);
      if (!state || state.anchorX === null) return;

      const offset = parseFloat(item.dataset.preJumpWordOffset || "0") || 0;
      const desiredX = state.anchorX + (offset * state.scale);
      item.style.transform = `translateX(${desiredX}px)`;

      // Width changes with font-size; keep cached width in sync for culling logic.
      item.dataset.width = item.offsetWidth;
    });
  }

  // Remove items that are off screen and add new ones
  itemsToRemove.forEach(item => {
    const parentSpan = item.parentElement;
    item.remove();
    // Clean up empty word spans
    if (parentSpan.classList.contains("word") && parentSpan.children.length === 0) {
      parentSpan.remove();
    }
    // Add a new item to maintain continuous flow
    charIndex = addNewScrollItem(charIndex, scroller);
  });

  return charIndex;
}

function startAllAnimations(charIndexes, scrollers) {
  config.isAnimating = true;
  let lastTime = performance.now();
  let frameCount = 0;

  function animateAll(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    frameCount++;

    // Update ALL scrollers in this single frame with scaled speed
    scrollers.forEach((scroller, i) => {
      // Scale distance by font-size ratio so all scrollers move at same relative speed
      const scaledSpeed = config.scrollSpeed * config.fontSizeRatios[i];
      const distance = (deltaTime / 1000) * scaledSpeed;
      charIndexes[i] = updateScroller(scroller, charIndexes[i], distance);
    });

    // Throttle color updates to every 3rd frame to reduce layout queries
    if (frameCount % 3 === 0) {
      scrollers.forEach(scroller => colorSpansByOffset(scroller));
    }

    // Continue animation
    if (config.isAnimating) {
      config.animationFrames[0] = requestAnimationFrame(animateAll);
    }
  }

  config.animationFrames[0] = requestAnimationFrame(animateAll);
}

function stopAnimation() {
  config.isAnimating = false;
  if (config.animationFrames[0] !== null) {
    cancelAnimationFrame(config.animationFrames[0]);
    config.animationFrames[0] = null;
  }
}

function getBaseFontVw() {
  const rootStyles = getComputedStyle(document.documentElement);
  const raw = rootStyles.getPropertyValue("--fontsize").trim();
  const parsed = parseFloat(raw);
  if (!Number.isNaN(parsed) && raw.endsWith("vw")) {
    return parsed;
  }
  return config.preJumpTransition.fallbackBaseFontVw;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function getTranslateX(item) {
  const transform = item.style.transform;
  return parseFloat(transform.match(/translateX\(([^)]+)px\)/)?.[1] || 0);
}

function reflowScrollerItems(scroller) {
  const scrollItems = Array.from(scroller.querySelectorAll(".scroll-item"));
  if (scrollItems.length === 0) return;

  // Preserve the current left offset of the stream while recalculating widths.
  let currentX = getTranslateX(scrollItems[0]);
  scrollItems.forEach(item => {
    item.style.transform = `translateX(${currentX}px)`;
    const itemWidth = item.offsetWidth;
    item.dataset.width = itemWidth;
    currentX += itemWidth;
  });
}

function reflowScrollerSet(scrollers) {
  scrollers.forEach(reflowScrollerItems);
}

function reflowDuringTransition(scrollers, durationMs) {
  if (durationMs <= 0) {
    reflowScrollerSet(scrollers);
    return Promise.resolve();
  }

  return new Promise(resolve => {
    const start = performance.now();

    function frame(now) {
      reflowScrollerSet(scrollers);

      if (now - start < durationMs) {
        requestAnimationFrame(frame);
      } else {
        reflowScrollerSet(scrollers);
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

function pickRandomElements(list, count) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function normalizeWordToken(text) {
  return (text || "").toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, "");
}

function getRiTaStopWordsSet() {
  let stopWords = [];

  if (Array.isArray(RiTa.STOP_WORDS)) {
    stopWords = RiTa.STOP_WORDS;
  } else if (Array.isArray(RiTa.stopWords)) {
    stopWords = RiTa.stopWords;
  } else if (typeof RiTa.stopWords === "function") {
    stopWords = RiTa.stopWords();
  }

  if (typeof stopWords === "string") {
    stopWords = stopWords.split(/[\s,]+/);
  }

  return new Set((stopWords || []).map(word => normalizeWordToken(String(word))));
}

async function runPreJumpWordTransition(scrollers) {
  const transitionConfig = config.preJumpTransition;
  if (!transitionConfig.enabled) return;

  const words = scrollers.flatMap(scroller => Array.from(scroller.querySelectorAll(".word")));
  if (words.length === 0) return;

  const stopWords = getRiTaStopWordsSet();
  const filteredWords = words.filter(word => {
    const token = normalizeWordToken(word.textContent || "");
    return token && !stopWords.has(token);
  });

  if (filteredWords.length === 0) return;

  const ratio = Math.max(0, Math.min(1, transitionConfig.affectedWordRatio));
  const wordsToAffect = Math.floor(filteredWords.length * ratio);
  if (wordsToAffect < 1) return;

  const selectedWords = pickRandomElements(filteredWords, wordsToAffect);
  const affectedScrollers = new Set();
  const minRatio = Math.min(...config.fontSizeRatios) * transitionConfig.smallestFontScale;
  const maxRatio = Math.max(...config.fontSizeRatios) * transitionConfig.largestFontScale;
  const baseFontVw = getBaseFontVw();

  selectedWords.forEach((word, wordIndex) => {
    const wordItems = Array.from(word.querySelectorAll(".scroll-item"));
    if (wordItems.length === 0) return;

    const wordId = `prejump-${Date.now()}-${wordIndex}`;
    const anchorX = getTranslateX(wordItems[0]);
    const baseFontPx = parseFloat(getComputedStyle(wordItems[0]).fontSize) || 1;

    word.dataset.preJumpOriginalFontSize = word.style.fontSize || "";
    word.dataset.preJumpOriginalTransition = word.style.transition || "";
    word.dataset.preJumpOriginalColor = word.style.color || "";
    word.dataset.preJumpWordId = wordId;
    word.dataset.preJumpBaseFontPx = `${baseFontPx}`;

    wordItems.forEach((item, idx) => {
      item.dataset.preJumpWordId = wordId;
      item.dataset.preJumpWordOffset = `${getTranslateX(item) - anchorX}`;
      if (idx === 0) {
        item.dataset.preJumpWordAnchor = "1";
      } else {
        delete item.dataset.preJumpWordAnchor;
      }
    });

    word.style.transition = `font-size ${transitionConfig.sizeTransitionMs}ms ease-in-out`;
    const randomVw = getRandomBetween(baseFontVw * minRatio, baseFontVw * maxRatio);
    word.style.fontSize = `${randomVw.toFixed(3)}vw`;
    word.style.color = "white";

    Array.from(word.querySelectorAll(".scroll-item")).forEach(item => {
      item.dataset.preJumpOriginalZIndex = item.style.zIndex || "";
      item.style.zIndex = "100";
    });

    const scroller = word.closest(".scroller");
    if (scroller) {
      affectedScrollers.add(scroller);
    }
  });

  affectedScrollers.forEach(scroller => {
    scroller.dataset.preJumpOriginalOverflow = scroller.style.overflow || "";
    scroller.dataset.preJumpOriginalZIndex = scroller.style.zIndex || "";
    scroller.style.overflow = "visible";
    scroller.style.zIndex = "10";
  });

  const container = scrollers[0] && scrollers[0].closest("#container");
  const containerOriginalOverflow = container ? (container.style.overflow || "") : null;
  if (container) container.style.overflow = "visible";

  await wait(transitionConfig.holdMs);

  selectedWords.forEach(word => {
    const originalSize = word.dataset.preJumpOriginalFontSize;
    const originalTransition = word.dataset.preJumpOriginalTransition;

    word.style.transition = originalTransition;
    if (originalSize) {
      word.style.fontSize = originalSize;
    } else {
      word.style.removeProperty("font-size");
    }

    const originalColor = word.dataset.preJumpOriginalColor;
    if (originalColor) {
      word.style.color = originalColor;
    } else {
      word.style.removeProperty("color");
    }

    delete word.dataset.preJumpOriginalFontSize;
    delete word.dataset.preJumpOriginalTransition;
    delete word.dataset.preJumpOriginalColor;
    delete word.dataset.preJumpWordId;
    delete word.dataset.preJumpBaseFontPx;

    Array.from(word.querySelectorAll(".scroll-item")).forEach(item => {
      const origZ = item.dataset.preJumpOriginalZIndex;
      if (origZ) {
        item.style.zIndex = origZ;
      } else {
        item.style.removeProperty("z-index");
      }
      delete item.dataset.preJumpOriginalZIndex;
      delete item.dataset.preJumpWordId;
      delete item.dataset.preJumpWordOffset;
      delete item.dataset.preJumpWordAnchor;
    });
  });

  affectedScrollers.forEach(scroller => {
    const origOverflow = scroller.dataset.preJumpOriginalOverflow;
    const origZIndex = scroller.dataset.preJumpOriginalZIndex;
    scroller.style.overflow = origOverflow || "";
    scroller.style.zIndex = origZIndex || "";
    if (!origOverflow) scroller.style.removeProperty("overflow");
    if (!origZIndex) scroller.style.removeProperty("z-index");
    delete scroller.dataset.preJumpOriginalOverflow;
    delete scroller.dataset.preJumpOriginalZIndex;
  });

  if (container) {
    if (containerOriginalOverflow) {
      container.style.overflow = containerOriginalOverflow;
    } else {
      container.style.removeProperty("overflow");
    }
  }
}

// older functions
async function scrollFirstWord(scrollContainer, wordSourceFunction, prevWord = "", lineNum, generatedText, wordIndex, duration = 1250) { // default: per word
  let spanned = "";
  const spanRegex = /^<span[^>]*>(.*?)<\/span>/;
  const easeInOutQuad = (t) => (t < 0.5) ? (2 * t * t) : (-1 + (4 - 2 * t) * t);

  while (true) {
    const wordToScroll = scrollContainer.firstChild;
    const amountToScroll = wordToScroll.offsetWidth;

    // Start fetching the next word while current one scrolls (pipelined)
    let nextWordPromise = (async () => {
      let inner = scrollContainer.innerHTML;
      let headWord = inner.match(spanRegex);
      let decapitated = inner.replace(headWord[0], "").replace(longTail, "");
      let children = scrollContainer.children;
      let tailWord = children[children.length - 2];
      prevWord = tailWord.innerHTML.trim();
      return await wordSourceFunction(prevWord, lineNum, wordIndex, generatedText);
    })();

    // Smooth scroll using requestAnimationFrame + easing
    scrollContainer.scrollLeft = 0;
    await new Promise((resolve) => {
      const startTime = performance.now();
      const from = 0;
      const to = amountToScroll;

      function frame(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = easeInOutQuad(t);
        scrollContainer.scrollLeft = from + (to - from) * eased;
        colorSpansByOffset(scrollContainer);
        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          scrollContainer.scrollLeft = to;
          colorSpansByOffset(scrollContainer);
          resolve();
        }
      }

      requestAnimationFrame(frame);
    });

    // Await the pre-fetched next word result
    [spanned, prevWord, wordIndex] = await nextWordPromise;
    scrollContainer.innerHTML = scrollContainer.innerHTML.replace(spanRegex, "").replace(longTail, "") + spanned + longTail;
    scrollContainer.scrollLeft = 0;
  }
}

function getNextSourceWord (lastWord, lineNum, wordIndex, generatedText) {
  return new Promise((resolve) => {
    // function findNonRepeat () { // would avoid repeated words
      let nextWord = generatedText[wordIndex];
      wordIndex = (wordIndex + 1) % generatedText.length;
      // if (nextWord !== lastWord) {
      resolve([spanify(nextWord), nextWord, wordIndex]);
      // } else {
      //   setTimeout(findNonRepeat, 0);
      // }
    }
    // findNonRepeat();
  );
}

function getHeadWord(prevWord, lineNum, wordIndex) {
  const spanRegex = /^<span[^>]*>(.*?)<\/span>/;
  return new Promise((resolve, reject) => {
    let inner = document.getElementById("scroll" + (lineNum + 1)).innerHTML;
    let spanned = inner.match(spanRegex);
    if (!spanned) {
      reject(new Error("No span found in next line"));
      return;
    }
    if (spanned[1].trim() !== prevWord) {
      resolve([spanned[0], prevWord, wordIndex]);
    } else {
      // Try again after a short delay
      setTimeout(() => {
        resolve(getHeadWord(prevWord, lineNum, wordIndex));
      }, 10);
    }
  });
}

function colorSpansByOffset(scrollDiv, leftRatio = 0.4, rightRatio = 0.85, highlight="red") {
  // Early return before any DOM queries
  if (!["scroll7", "scroll8","scroll9"].includes(scrollDiv.id)) return;
  
  if (["scroll7", "scroll9"].includes(scrollDiv.id)) {
    leftRatio = 0.52;
    rightRatio = 0.7;
    highlight = "pink";
  }
  
  const spans = scrollDiv.querySelectorAll("span");
  const containerWidth = scrollDiv.offsetWidth;
  const leftEdge = containerWidth * leftRatio;
  const rightEdge = containerWidth * rightRatio;
  
  spans.forEach(span => {
    // Use transform value instead of offsetLeft to avoid layout query
    const transform = span.style.transform;
    const offset = parseFloat(transform.match(/translateX\(([^)]+)px\)/)?.[1] || 0);
    if (offset > leftEdge && offset < rightEdge) {
      span.classList.add(highlight);
    } else {
      span.classList.remove(highlight);
    }
  });
}
const longTail = "<span>" + "&nbsp;".repeat(100) + "</span>";
// export all functions and config
export {config, createContent, startAllAnimations, stopAnimation, runPreJumpWordTransition, logDebug};