### *Storm Reader*

Hello all. I started this copied from https://programmatology.com/apps/saying and so the code was at first somewhat riddled with odd variable names (because that piece uses its code as source text). I've tidied this up in the `main` branch. Branches as follows:
- `main`: for shared developments
- `site`: serving the visualization on github pages
- `sevenlines`: just to preserve the original seven line version with variable scrolling

  John will be mostly working on local untracked feature branches and rebasing to push these to `main`.

### ToDos
- [ scrolling from the middle of a container using scroll-snap did not go well ]
- [ translating a div containing text also produced problematice behavior ...]
- ... so John's now moving boxes with words in them and although this sounds worse, it's better
- addlines top and bottom with scaling to produce a fisheye effect but only on the y-axis
