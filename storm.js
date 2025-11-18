function thinkingOfWords (lastWord, lineNum, wordIndex, whatIAmGenerating) {
  return new Promise((resolve) => {
    // function overAndOver() {
      let thoughts = whatIAmGenerating[wordIndex];
      wordIndex = (wordIndex + 1) % whatIAmGenerating.length;
      // if (thoughts !== lastWord) {
      resolve([enclosing(thoughts), thoughts, wordIndex]);
      // } else {
      //   setTimeout(overAndOver, 0);
      // }
    }
    // overAndOver();
  );
}

function enclosing (thoughts) {
  return `<span>${thoughts} </span>`;
}

const longTail = "<span>" + "&nbsp;".repeat(100) + "</span>";

async function scrollFirstWord(scrollContainer, wordSourceFunction, prevWord = "", lineNum, whatIAmGenerating, wordIndex, duration = 1250) { // default: per word
  let spanned = "";
  const spanRegex = /^<span[^>]*>(.*?)<\/span>/;
  while (true) {
    const wordToScroll = scrollContainer.firstChild;
    const amountToScroll = wordToScroll.offsetWidth;
    const stepCount = Math.max(1, Math.floor(amountToScroll));
    const stepSize = amountToScroll / stepCount;
    const stepTime = duration / stepCount;
    // Smooth scroll using requestAnimationFrame + easing for consistent motion
    scrollContainer.scrollLeft = 0;
    const easeInOutQuad = (t) => (t < 0.5) ? (2 * t * t) : (-1 + (4 - 2 * t) * t);
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
          // ensure final position
          scrollContainer.scrollLeft = to;
          colorSpansByOffset(scrollContainer);
          resolve();
        }
      }

      requestAnimationFrame(frame);
    });
    let inner = scrollContainer.innerHTML;
    let head = inner.match(spanRegex);
    let decapitated = inner.replace(head[0], "").replace(longTail, "");
    let children = scrollContainer.children;
    let tail = children[children.length - 2];
    prevWord = tail.innerHTML.trim();
    // wordSourceFunction is either getHead or thinkingOfWords
    [spanned, prevWord, wordIndex] = await wordSourceFunction(prevWord, lineNum, wordIndex, whatIAmGenerating);
    scrollContainer.innerHTML = decapitated + spanned + longTail;
    scrollContainer.scrollLeft = 0;
    // scrollContainer.scrollLeft += stepSize; // extra step for slight easing NEEDED?
  }
}

function getHead(prevWord, lineNum, wordIndex) {
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
        resolve(getHead(prevWord, lineNum, wordIndex));
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
export {scrollFirstWord, getHead, enclosing, thinkingOfWords, longTail};