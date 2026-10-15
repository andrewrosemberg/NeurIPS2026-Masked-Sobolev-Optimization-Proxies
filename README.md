# NeurIPS2026-Masked-Sobolev-Optimization-Proxies

Official repo of "Masked Sobolev Training for Feasibility-Reliable Optimization Proxies" (NeurIPS 2026). Sparse stochastic derivative supervision for improving the generalization and feasibility of learned optimization proxies.

## Paper website

**https://andrewrosemberg.github.io/NeurIPS2026-Masked-Sobolev-Optimization-Proxies/**

The static website lives in `docs/`. It uses plain HTML, CSS, and JavaScript,
with no build step or third-party runtime dependencies. Fonts are self-hosted;
the font license is in `docs/assets/FONT-LICENSE.txt`.

The NeurIPS camera-ready paper and research code are **coming soon**.

### Add the paper and code links

Edit the `RELEASES` object at the top of `docs/site.js`:

```js
const RELEASES = Object.freeze({
  paper: 'https://the-final-neurips-paper-url',
  code: 'https://the-research-code-url',
});
```

Leave either value as `null` to retain its visible, non-clickable "Coming soon"
state. When a URL is present, the corresponding resource becomes an ordinary
link labeled "Available now". Use the code repository or release URL, not a
link back to the placeholder website.

### Preview locally

```sh
python3 -m http.server 8000 --directory docs
```

Open http://localhost:8000. All asset URLs are relative, so the site works
under the GitHub Pages project path.

### GitHub Pages configuration

In **Settings → Pages**, use **Deploy from a branch**, branch **main**, folder
**/docs**. Changes pushed to `main` publish automatically. The `.nojekyll` file
keeps the source as a plain static site.

### Content provenance

The page summarizes the manuscript and uses its method diagram and Acrobot
training figure. The AC-OPF chart and tables use the numerical values reported
in the paper. Mean-infeasibility reductions use the value-only baseline as the
denominator (14.66%, 32.65%, and 28.81%, rounded). The interactive matrix is an
illustration of uniform fixed-size masking, not experimental data. Requested
densities are rounded to the nearest entry of its 144-entry matrix.

The regional theory assumes ideal interpolation and regularity and does not
guarantee convergence of the masked algorithm. The Acrobot threshold comparison
uses the first reconstructed threshold crossings, not an average over runs.

## Citation

```bibtex
@inproceedings{rosemberg2026masked,
  title = {Masked Sobolev Training for Feasibility-Reliable Optimization Proxies},
  author = {Rosemberg, Andrew W. and Garcia, Joaquim Dias and Bent, Russell and Van Hentenryck, Pascal},
  booktitle = {Advances in Neural Information Processing Systems},
  year = {2026}
}
```

## Illustrations and animation exports

The original visual design is retained. The expanded story follows the paper's
progression: generalization under regularity, general constrained optimization,
and the limits of highly localized sensitivities. The portfolio baseline is
objective-only, with feasibility enforced by construction in both methods.

`docs/illustrations.js` supplies four live canvas illustrations. Every widget
has a pause control and speed selector; it stops advancing when offscreen or in
a hidden tab, and starts paused for reduced-motion users. GIFs are downloaded
on demand, rather than autoplaying unpausable media. PNG stills are provided for
JavaScript-disabled browsers. GIFs use 10 fps with 12–16-second loops; the mask
holds for 3.6 seconds per update.

- **Masking:** new input and uniform fixed-size mask at each illustrated update;
  complete value supervision and the same retained entries in both Jacobians.
- **Acrobot:** illustrative kinematics and a synthetic smooth local policy slice.
  This is neither a PPO rollout nor the control cost landscape.
- **Dispatch:** a schematic network, not a solved AC-OPF trajectory. The lower
  plane illustrates gradients and contours of a synthetic normalized mean of
  per-entry quadratic derivative-matching losses. These are not additional
  objective/constraint penalty terms in the experimental loss. All selected
  terms have equal sampling probability; the mask is not adaptive.
- **Portfolio:** a solved six-asset toy instance with diagonal covariance,
  synthetic expected returns, nonnegative allocations, a risk cap and an
  inequality budget. A closed-form KKT solution plus a scalar budget-multiplier
  search computes the allocations. The surface shows allocation to asset A as
  two expected returns vary; it is not a nonconvex portfolio objective. The
  covariance diagonal is `[.22², .31², .18², .25², .21², .28²]`, and B = 1.

These visuals are explanatory and separate from the measured results. The
worst-violation violin plot is exported from the paper's figure. The highlighted
18%, 400% and 180% medians use the paper's **normalized RMI**: the difference
between each instance's worst baseline and Sobolev violations, divided by the
single largest Sobolev violation in that network's test set. They are not
ordinary baseline-relative percent reductions; the page states this explicitly.

### Regenerate GIFs and stills (optional)

The public site needs no build or package installation. To edit and export the
animations locally, install Node.js, FFmpeg and the optional development tool:

```sh
npm install
npx playwright install chromium
npm run render:gifs
```

The export script uses the same frame renderer as the live page and writes four
GIFs and four PNG stills to `docs/assets/`. It starts a temporary local server
and removes its frame directory on completion. An existing browser executable
can be selected with `CHROMIUM_EXECUTABLE`; `PLAYWRIGHT_MODULE` can select an
already installed Playwright module. Neither setting is needed normally.
