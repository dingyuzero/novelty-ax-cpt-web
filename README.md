# Stroop-CPT and Color AX-CPT Web Battery

Mobile-first web battery for three short CPT-style experiments:

- `Late Stroop-CPT`: colored shape cue, colored color-word probe.
- `Early Stroop-CPT`: colored color-word cue, colored shape probe.
- `Color AX-CPT`: color-patch cue and neutral color-word probe, without Stroop conflict.

The app includes practice and formal modes, block-balanced schedules, thought probes, JSON/CSV export, and immediate descriptive results.

## Run Locally

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Test

On Windows PowerShell, use `npm.cmd` if script execution is restricted:

```bash
npm.cmd test
```

## Design Notes

See `docs/stroop_cpt_design.md` for the full experimental design, timing, primary indices, CDS/ADHD interpretation plan, and references.
