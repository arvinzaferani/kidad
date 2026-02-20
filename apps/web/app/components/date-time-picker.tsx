'use client';

interface DateTimePickerProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const formatJalaliDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('fa-IR-u-ca-persian', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
};

export function DateTimePicker({
  id,
  label,
  value,
  onChange,
  required,
}: DateTimePickerProps) {
  const jalaliPreview = value ? formatJalaliDateTime(value) : null;

  return (
    <div className="stack">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="field"
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
      {jalaliPreview ? <p className="field-hint">نمایش جلالی: {jalaliPreview}</p> : null}
    </div>
  );
}
