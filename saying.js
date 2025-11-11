function saying (whatIAmGenerating) {
  const recognitions=[["="," being "],["RegExp","regular expression"],["replace","memory"],["[^\\w]"," "],["([A-Z])"," $1"],["const ","constantly "],["function","saying"],["match","archive"],["aeiou","breathing"],["split","language"],["floor","ground"],["length","extension"],["case","sayable"],["set","horizon"],["Timeout","ceasing"],[" +"," "]]
  const moving=(qualities,here,there)=> qualities=qualities.replace(new RegExp(here,"g"),there)
  function continualMovement(theLifeWorldReading,recognitions) {
    for(const reading of recognitions) {
      theLifeWorldReading=moving(theLifeWorldReading,reading[0],reading[1])
    }
    return theLifeWorldReading
  }
  function expressing (imagining) {
    let writing = []
    for (const images of imagining) {
      if (images.match(/[aeiou]/)) writing.push(images)
    }
    return writing
  }
  whatIAmGenerating=continualMovement(whatIAmGenerating,recognitions)
  whatIAmGenerating=expressing(whatIAmGenerating.split(" "))
  return whatIAmGenerating
}
function thinkingOfWords (lastWord, nothing, whatIAmGenerating) {
  return new Promise((resolve) => {
    function overAndOver() {
      let thoughts = whatIAmGenerating[Math.floor(Math.random() * whatIAmGenerating.length)].toLowerCase();
      if (thoughts !== lastWord) {
        resolve([enclosing(thoughts), thoughts]);
      } else {
        setTimeout(overAndOver, 0);
      }
    }
    overAndOver();
  });
}
// considered as far as here
function enclosing (thoughts) {
  // let spanned = "";
  // for (let i = 0; i < thoughts.length; i++) {
  //   spanned += `<span>${thoughts[i]}</span>`;
  // }
  // return spanned + `<span> </span>`;
  return `<span>${thoughts} </span>`;
}
const longTail = "<span>" + "&nbsp;".repeat(100) + "</span>";
async function scrollFirstWord(scrollContainer, wordSource, prevWord = "", lineNum, whatIAmGenerating, duration = 1250) { // 1250 for WORD
  let spanned = "";
  const spanRegex = /^<span[^>]*>(.*?)<\/span>/;
  while (true) {
    const wordToScroll = scrollContainer.firstChild;
    const amountToScroll = wordToScroll.offsetWidth;
    const stepCount = Math.max(1, Math.floor(amountToScroll));
    const stepSize = amountToScroll / stepCount;
    const stepTime = duration / stepCount;
    let currentStep = 0;
    scrollContainer.scrollLeft = 0;
    await new Promise((resolve) => {
      function smoothScroll() {
        if (currentStep >= stepCount) {
          resolve();
        } else {
          scrollContainer.scrollLeft += stepSize;
          colorSpansByOffset(scrollContainer);
          currentStep++;
          setTimeout(smoothScroll, stepTime);
        }
      }
      smoothScroll();
    });
    let inner = scrollContainer.innerHTML;
    let head = inner.match(spanRegex);
    let decapitated = inner.replace(head[0], "").replace(longTail, "");
    let children = scrollContainer.children;
    let tail = children[children.length - 2];
    prevWord = tail.innerHTML.trim();
    [spanned, prevWord] = await wordSource(prevWord, lineNum, whatIAmGenerating);
    scrollContainer.innerHTML = decapitated + spanned + longTail;
    scrollContainer.scrollLeft = 0;
    // scrollContainer.scrollLeft += stepSize; // extra step for slight easing NEEDED?
  }
}
function getHead(prevWord, lineNum) {
  const spanRegex = /^<span[^>]*>(.*?)<\/span>/;
  return new Promise((resolve, reject) => {
    let inner = document.getElementById("scroll" + (lineNum + 1)).innerHTML;
    let spanned = inner.match(spanRegex);
    if (!spanned) {
      reject(new Error("No span found in next line"));
      return;
    }
    if (spanned[1].trim() !== prevWord) {
      resolve([spanned[0], prevWord]);
    } else {
      // Try again after a short delay
      setTimeout(() => {
        resolve(getHead(prevWord, lineNum));
      }, 10);
    }
  });
}
function colorSpansByOffset(scrollDiv, leftRatio = 0.37, rightRatio = 0.85) {
  if (scrollDiv.id != "scroll3") return;
  const spans = scrollDiv.querySelectorAll("span");
  const containerWidth = scrollDiv.offsetWidth;
  const leftEdge = containerWidth * leftRatio;
  const rightEdge = containerWidth * rightRatio;
  spans.forEach(span => {
    const offset = span.offsetLeft;
    if (offset > leftEdge && offset < rightEdge) {
      span.classList.add("red");
    } else {
      span.classList.remove("red");
    }
  });
}
export {saying, scrollFirstWord, getHead, thinkingOfWords, longTail};