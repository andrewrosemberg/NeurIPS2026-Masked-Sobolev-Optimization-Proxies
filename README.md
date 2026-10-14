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
