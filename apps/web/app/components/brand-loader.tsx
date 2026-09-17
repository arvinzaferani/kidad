export function BrandLoader({ label }: { label?: string }) {
  return (
    <div className="brand-loader" role="status" aria-live="polite">
      <div className="brand-loader-circle" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kidad-logo.png" alt="" className="brand-loader-logo" />
      </div>
      {label ? <p className="brand-loader-label">{label}</p> : null}
    </div>
  );
}