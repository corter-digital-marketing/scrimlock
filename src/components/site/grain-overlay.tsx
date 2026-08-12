/**
 * Fixed, page-wide texture: a soft vignette plus a static film-grain layer.
 * Purely decorative — aria-hidden, pointer-events-none, and kept low-opacity
 * so it reads as texture rather than noise (per §6).
 */
export function GrainOverlay() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, transparent 0%, transparent 45%, color-mix(in oklab, var(--bg-void) 55%, transparent) 100%), radial-gradient(ellipse at 50% 100%, transparent 40%, color-mix(in oklab, black 45%, transparent) 100%)",
        }}
      />
      <div className="bg-grain absolute inset-0 opacity-[0.05] mix-blend-overlay" />
    </div>
  );
}
