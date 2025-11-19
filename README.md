### *Storm Reader*

Hello all. I started this copied from https://programmatology.com/apps/saying and so the code was at first somewhat riddled with odd variable names (because that piece uses its code as source text). I've tidied this up in the `main` branch. Branches as follows:
- `main`: for shared developments
- `john`: john's development branch
- `site`: serving the visualization on github pages
- `sevenlines`: just to preserve the original seven line version with variable scrolling

  I'll be changing tack on my `john` branch, to:
- experiment with css controlled scrolling from the middle of a container using scroll-snap (should easier to get a center focused smooth scroll of text items in span tags)
- addlines top and bottom with scaling to produce a fisheye effect but only on the y-axis
