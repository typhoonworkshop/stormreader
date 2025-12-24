// new
const config = {
  generatedText: "",
  numOfChars: 0,
  numOfLines: 7,
  isAnimating: true,
  animationFrames: Array(7).fill(null),
  scrollSpeed: 150, // pixels per second (base speed for 100% font-size)
  fontSizeRatios: [0.25, 0.50, 0.75, 1.0, 0.75, 0.50, 0.25], // font-size ratio per scroller
};

// newer functions
function createContent(charIndex, scroller) {
  charIndex = charIndex === -1 ? Math.floor(Math.random() * config.numOfChars) : charIndex;
  let left = 0;
  const targetWidth = scroller.clientWidth;
  let currentWidth = 0;

  // Fill until width exceeds scroller width
  while (currentWidth < targetWidth) {
    const item = createScrollItem(config.generatedText[charIndex], left);
    scroller.append(item);

    // Get the actual width including margin
    const itemWidth = item.offsetWidth;
    item.dataset.width = itemWidth; // Cache for animation
    left += itemWidth;
    currentWidth = left;

    console.log(`char: "${config.generatedText[charIndex]}", Width: ${itemWidth}px, Total: ${currentWidth}px`);
    charIndex = (charIndex + 1) % config.numOfChars;
  }

  // Append five additional scroll items for smooth transition
  for (let j = 0; j < 5; j++) {
    const item = createScrollItem(config.generatedText[charIndex], left);
    scroller.append(item);

    const itemWidth = item.offsetWidth;
    item.dataset.width = itemWidth; // Cache for animation
    left += itemWidth;

    console.log(`Extra char ${j + 1}: "${config.generatedText[charIndex]}", Width: ${itemWidth}px`);
    charIndex = (charIndex + 1) % config.numOfChars;
  }

  return charIndex;
}
function createScrollItem(char, leftPosition) {
  const item = document.createElement('span');
  item.className = "scroll-item";
  item.textContent = char;
  item.style.transform = `translateX(${leftPosition}px)`;
  // Cache width as data attribute to avoid layout queries during animation
  item.dataset.width = '0'; // Will be updated after first render
  return item;
}
function addNewScrollItem(charIndex, scroller) {
  // Find the rightmost position of existing items
  const scrollItems = Array.from(scroller.children);
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

  const newItem = createScrollItem(config.generatedText[charIndex], rightmostPosition);
  scroller.append(newItem);

  // Cache width after appending
  const itemWidth = newItem.offsetWidth;
  newItem.dataset.width = itemWidth;

  charIndex = (charIndex + 1) % config.numOfChars;

  return charIndex;
}

function updateScroller(scroller, charIndex, distance) {
  // Update position of each scroll item
  const itemsToRemove = [];
  const scrollItems = Array.from(scroller.children);

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

  // Remove items that are off screen and add new ones
  itemsToRemove.forEach(item => {
    item.remove();
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
  if (!["scroll2", "scroll3","scroll4"].includes(scrollDiv.id)) return;
  
  if (["scroll2", "scroll4"].includes(scrollDiv.id)) {
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
export {config, createContent, startAllAnimations};