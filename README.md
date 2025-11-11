### *The code is saying[.js]*
This is a dynamic version (which will be further developed) of a piece first published in *Run Run Run* (ed. Nick Montfort, New York: Bad Quarto, 2025, p. 8). It loads its minimal text-generating code as its own supply text. In the <code>node.js</code> version, the JavaScript file itself is loaded locally. At the moment, this version uses a copy of text for the two generating functions of the code module, as displayed here:

```
function saying (whatIAmGenerating) {
  const recognitions=[["="," being "],["RegExp","regular expression"],["replace",
  "memory"],["[^\\w]"," "],["([A-Z])"," $1"],["const ","constantly "],["function",
  "saying"],["match","archive"],["aeiou","breathing"],["split","language"],["floor",
  "ground"],["length","extension"],["case","sayable"],["set","horizon"],["Timeout",
  "ceasing"],[" +"," "]]
  const moving=(qualities,here,there)=> qualities=qualities.replace(new RegExp(here,"g"),there)
  function continualMovement(theLifeWorldReading,recognitions) {
    for(const reading of recognitions) {
      theLifeWorldReading=moving(theLifeWorldReading,reading[0],reading[1])}
    return theLifeWorldReading}
  function expressing (imagining) {
    let writing = []
    for (const images of imagining) {
      if (images.match(/[aeiou]/)) writing.push(images)}
    return writing}
  whatIAmGenerating=continualMovement(whatIAmGenerating,recognitions)
  whatIAmGenerating=expressing(whatIAmGenerating.split(" "))
  return whatIAmGenerating}
function thinkingOfWords (lastWord, nothing, whatIAmGenerating) {
  return new Promise((resolve) => {
    function overAndOver() {
      let thoughts = whatIAmGenerating[Math.floor(Math.random() * 
        whatIAmGenerating.length)].toLowerCase();
      if (thoughts !== lastWord) {
        resolve([enclosing(thoughts), thoughts]);
      } else {
        setTimeout(overAndOver, 0);}}
    overAndOver();});}
```
