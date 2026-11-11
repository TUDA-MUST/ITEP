# Amplitude tapering

Issue: https://github.com/TUDA-MUST/ITEP/issues/230

Excitation offers Uniform (the legacy default), Taylor and Dolph–Chebyshev windows.
Design SLL is a negative window parameter, from −80 to −15 dB; Taylor nbar is an
integer from 2 to 10, initially 4. It is not an optimization constraint on the
actual array. The preview and Results use the same weighted pattern and measure
achieved SLL relative to each cut's peak. Element amplitudes are normalized so the
largest weight is 1; no total-power compensation is applied to field calculations.

## Spatial mapping

- Rectangular: multiply X and Y profiles evaluated at each element's physical
  position, normalized to the aperture's bounding box. A zero-width axis has
  weight 1. Regular rectangular arrays use exactly their row and column window
  lengths, reproducing discrete window coefficients at the element positions.
- Radial: evaluate the positive half of a symmetric profile at distance/radius.
  Generated geometries use their known origin. Imported positions use the
  bounding-box midpoint. Radius is the maximum element distance from that center.
- Non-grid rectangular profiles and radial profiles use 129 symmetric samples
  with linear interpolation. This is a defined spatial window mapping, not a
  promise of equiripple sidelobes on an arbitrary aperture. In particular the
  finite Dolph–Chebyshev profile depends on this chosen order and can have elevated
  endpoint weights; changing profile resolution changes the resulting mapping.
- Radial weighting on a generated single ring is uniform after normalization,
  including odd-sided rings. Rectangular weighting may instead shape a ring
  directionally. No element-list indexing is used to assign weights.

Rectangular and imported arrays default to rectangular mapping; other geometries
use radial. Explicit settings survive geometry edits. Loading a legacy preset
resets to Uniform, while presets with taper settings restore those settings.

## Graphs and measurements

The excitation graph has an AZ/EL selector, numeric Design SLL input, and a native
ECharts graphic handle over a markLine. Numeric entry remains available below the
unchanged −30 dB chart floor; the corresponding marker is outside the visible
range. Dragging is restricted to the visible supported interval, −30 to −15 dB.
The separate chart-floor ticket owns changing this range and its UI.

Cross sections are sampled every 0.25 degrees. First magnitude minima bound the
main lobe, with parabolic refinement of their squared magnitudes. This avoids
phase-dependent real-part zero crossings on translated/asymmetric arrays. On an
arbitrary aperture these minima need not be exact nulls; the existing FNBW labels
are retained. SLL is unavailable if both boundaries cannot be identified. Very
narrow lobes or deep nulls can require finer sampling; this is not a continuous
optimization or full-sphere peak-sidelobe measurement.

CPU patterns, GPU far fields, near fields, image exports and the existing compute
export shader consume the same relative amplitude stored in phasor.y. Existing
3D display scaling is retained, so changes in total excitation remain observable.

## Validation

`taper-reference.json` contains independently generated SciPy `taylor` and
`chebwin` values, normalized by the maximum sampled coefficient. Cases cover
lengths 1, 2, 5, 6, 16 and 129, and suppression 15, 30, 60 and 80 dB (nbar=4).
Tests also cover parameter bounds, mapping/order invariance, translation,
degenerate apertures, ring behavior, normalized SLL, state lifecycle, amplitude
buffer packing and the chart drag/input synchronization.

References:

- https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.windows.taylor.html
- https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.windows.chebwin.html
- https://echarts.apache.org/handbook/en/how-to/interaction/drag/
