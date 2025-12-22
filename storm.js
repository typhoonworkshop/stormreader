// new
const config = {
  generatedText: "",
  numOfChars: 0,
  numOfLines: 7,
  isAnimating: true,
  animationFrames: Array(7).fill(null),
  scrollSpeed: 150, // pixels per second
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

    // Force layout recalculation to get accurate width
    scroller.offsetHeight; // This forces a reflow
    // Get the actual width including margin
    const itemWidth = item.offsetWidth;
    left += itemWidth;
    currentWidth = left;

    console.log(`char: "${config.generatedText[charIndex]}", Width: ${itemWidth}px, Total: ${currentWidth}px`);
    charIndex = (charIndex + 1) % config.numOfChars;
  }

  // Append five additional scroll items for smooth transition
  for (let j = 0; j < 5; j++) {
    const item = createScrollItem(config.generatedText[charIndex], left);
    scroller.append(item);

    scroller.offsetHeight; // forces reflow
    const itemWidth = item.offsetWidth;
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
  item.style.left = `${leftPosition}px`;
  return item;
}
function addNewScrollItem(charIndex, scroller) {
  // Find the rightmost position of existing items
  const scrollItems = Array.from(scroller.children);
  let rightmostPosition = 0;

  scrollItems.forEach(item => {
    const itemLeft = parseFloat(item.style.left);
    const itemRight = itemLeft + item.offsetWidth;
    if (itemRight > rightmostPosition) {
      rightmostPosition = itemRight;
    }
  });

  const newItem = createScrollItem(config.generatedText[charIndex], rightmostPosition);
  scroller.append(newItem);

  // Force reflow to get accurate width
  scroller.offsetHeight;
  charIndex = (charIndex + 1) % config.numOfChars;

  // console.log(`Added new char: "${config.generatedText[(charIndex - 1 + config.numOfChars) % config.numOfChars]}" at position ${rightmostPosition}px`);

  return charIndex;
}

function animator(charIndex, scroller, scrollerIndex) {
  let lastTime = performance.now();

  function animate(currentTime) {
    const deltaTime = currentTime - lastTime;
    const distance = (deltaTime / 1000) * 150 // speedSlider; // Pixels to move this frame
    lastTime = currentTime;

    // Update position of each scroll item
    const itemsToRemove = [];
    const scrollItems = Array.from(scroller.children);

    scrollItems.forEach((item, index) => {
      const currentLeft = parseFloat(item.style.left);
      const newLeft = currentLeft - distance; // Move left by distance
      item.style.left = `${newLeft}px`;

      // Check if item is completely off the left edge
      if (newLeft + item.offsetWidth < 0) {
        itemsToRemove.push(item);
      }
    });

    // Remove items that are off screen and add new ones
    itemsToRemove.forEach(item => {
      item.remove();
      // Add a new item to maintain continuous flow
      charIndex = addNewScrollItem(charIndex, scroller);
    });

    // Apply color highlighting
    colorSpansByOffset(scroller);

    // Continue animation
    if (config.isAnimating) {
      config.animationFrames[scrollerIndex] = requestAnimationFrame(animate);
    }
  }

  config.animationFrames[scrollerIndex] = requestAnimationFrame(animate);
}

function startAnimation(charIndex, scroller, scrollerIndex) {
  config.isAnimating = true;
  animator(charIndex, scroller, scrollerIndex);
}

function stopAnimation() {
  config.isAnimating = false;
  config.animationFrames.forEach((frameId, index) => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      config.animationFrames[index] = null;
    }
  });
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

function colorSpansByOffset(scrollDiv, leftRatio = 0.33, rightRatio = 0.85, highlight="red") {
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
    const offset = span.offsetLeft;
    if (offset > leftEdge && offset < rightEdge) {
      span.classList.add(highlight);
    } else {
      span.classList.remove(highlight);
    }
  });
}
const longTail = "<span>" + "&nbsp;".repeat(100) + "</span>";
// export all functions and config
export {config, createContent, startAnimation};