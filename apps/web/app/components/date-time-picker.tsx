'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type DateTimePickerProps = {
  id?: string;
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
};

type JalaliParts = {
  jy: number;
  jm: number;
  jd: number;
  hour: number;
  minute: number;
};

const monthNames = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const pad2 = (value: number) => String(value).padStart(2, '0');

const div = (a: number, b: number) => Math.trunc(a / b);

export const formatDateTimeLocalValue = (date: Date) => {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatJalaliDateTime = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('fa-IR-u-ca-persian', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
};

function gregorianToJalali(gy: number, gm: number, gd: number) {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy > 1600 ? 979 : 0;
  const gyBase = gy > 1600 ? gy - 1600 : gy - 621;
  const gy2 = gm > 2 ? gyBase + 1 : gyBase;
  let days =
    365 * gyBase +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) -
    80 +
    gd +
    gdm[gm - 1];

  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;

  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }

  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

function jalaliToGregorian(jy: number, jm: number, jd: number) {
  const jalaliYear = jy + 1595;
  let days =
    -355668 +
    365 * jalaliYear +
    div(jalaliYear, 33) * 8 +
    div((jalaliYear % 33) + 3, 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  let gy = 400 * div(days, 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days %= 36524;
    if (days >= 365) days += 1;
  }

  gy += 4 * div(days, 1461);
  days %= 1461;

  if (days > 365) {
    gy += div(days - 1, 365);
    days = (days - 1) % 365;
  }

  let gd = days + 1;
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  const monthDays = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  while (gm <= 12 && gd > monthDays[gm]) {
    gd -= monthDays[gm];
    gm += 1;
  }

  return { gy, gm, gd };
}

function getJalaliMonthLength(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;

  const esfandStart = jalaliToGregorian(jy, 12, 1);
  const nextYearStart = jalaliToGregorian(jy + 1, 1, 1);
  const start = new Date(esfandStart.gy, esfandStart.gm - 1, esfandStart.gd);
  const end = new Date(nextYearStart.gy, nextYearStart.gm - 1, nextYearStart.gd);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function parseValue(value?: string): JalaliParts {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const { jy, jm, jd } = gregorianToJalali(
    safeDate.getFullYear(),
    safeDate.getMonth() + 1,
    safeDate.getDate(),
  );

  return {
    jy,
    jm,
    jd,
    hour: safeDate.getHours(),
    minute: safeDate.getMinutes(),
  };
}

function toDateTimeValue({ jy, jm, jd, hour, minute }: JalaliParts) {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  return `${gy}-${pad2(gm)}-${pad2(gd)}T${pad2(hour)}:${pad2(minute)}`;
}

function moveMonth(jy: number, jm: number, direction: -1 | 1) {
  if (direction === -1 && jm === 1) return { jy: jy - 1, jm: 12 };
  if (direction === 1 && jm === 12) return { jy: jy + 1, jm: 1 };
  return { jy, jm: jm + direction };
}

export function PersianDateTimePicker({
  id,
  label = 'تاریخ و زمان',
  value,
  onChange,
  required,
  className,
}: DateTimePickerProps) {
  const parsed = useMemo(() => parseValue(value), [value]);
  const [parts, setParts] = useState(parsed);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = id ? `${id}-label` : undefined;

  useEffect(() => {
    setParts(parsed);
  }, [parsed]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const monthLength = getJalaliMonthLength(parts.jy, parts.jm);
  const selectedDay = Math.min(parts.jd, monthLength);
  const firstDayGregorian = jalaliToGregorian(parts.jy, parts.jm, 1);
  const firstWeekdayIndex =
    (new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd).getDay() + 1) % 7;
  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekdayIndex + 1;
    return day >= 1 && day <= monthLength ? day : null;
  });

  const summary = `${parts.jy}/${pad2(parts.jm)}/${pad2(selectedDay)} - ${pad2(parts.hour)}:${pad2(parts.minute)}`;
  const jalaliPreview = formatJalaliDateTime(value);

  const emit = (nextParts: JalaliParts) => {
    const normalizedParts = {
      ...nextParts,
      jd: Math.min(nextParts.jd, getJalaliMonthLength(nextParts.jy, nextParts.jm)),
    };
    setParts(normalizedParts);
    onChange(toDateTimeValue(normalizedParts));
  };

  const onMonthChange = (direction: -1 | 1) => {
    const nextMonth = moveMonth(parts.jy, parts.jm, direction);
    setParts((current) => ({
      ...current,
      ...nextMonth,
      jd: Math.min(current.jd, getJalaliMonthLength(nextMonth.jy, nextMonth.jm)),
    }));
  };

  return (
    <div ref={containerRef} className={`date-time-picker persian-date-time-picker ${className ?? ''}`.trim()}>
      <div className="date-time-picker-head">
        <label id={labelId} className="label" htmlFor={id}>
          {label}
        </label>
      </div>

      <button
        id={id}
        type="button"
        className="persian-picker-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-labelledby={labelId}
      >
        {/* <span>{summary}</span> */}
        {jalaliPreview ? <p className="field-hint">{jalaliPreview}</p> : null}

        <span aria-hidden="true">▾</span>
      </button>

      {open ? (
        <div className="persian-picker-popover">
          <div className="persian-picker-header">
            <button type="button" className="persian-picker-nav" onClick={() => onMonthChange(-1)}>
              ماه قبل
            </button>
            <strong>
              {monthNames[parts.jm - 1]} {parts.jy}
            </strong>
            <button type="button" className="persian-picker-nav" onClick={() => onMonthChange(1)}>
              ماه بعد
            </button>
          </div>

          <div className="persian-picker-weekdays">
            {weekDays.map((weekDay) => (
              <span key={weekDay}>{weekDay}</span>
            ))}
          </div>

          <div className="persian-picker-days">
            {calendarCells.map((day, index) =>
              day ? (
                <button
                  key={day}
                  type="button"
                  className={`persian-picker-day ${day === selectedDay ? 'persian-picker-day-active' : ''}`}
                  onClick={() => {
                    emit({ ...parts, jd: day });
                    setOpen(false);
                  }}
                >
                  {day}
                </button>
              ) : (
                <span key={`empty-${index}`} className="persian-picker-empty" />
              ),
            )}
          </div>

          <label className="persian-picker-time ">
            <span>ساعت</span>
            <input
              className="field "
              type="time"
              value={`${pad2(parts.hour)}:${pad2(parts.minute)}`}
              onChange={(event) => {
                const [hour = '0', minute = '0'] = event.target.value.split(':');
                emit({
                  ...parts,
                  hour: Number(hour),
                  minute: Number(minute),
                });
              }}
            />
          </label>
        </div>
      ) : null}

      {/* {jalaliPreview ? <p className="field-hint">{jalaliPreview}</p> : null} */}
    </div>
  );
}

export function DateTimePicker(props: DateTimePickerProps) {
  return <PersianDateTimePicker {...props} />;
}

export type PersianDateRangePickerProps = {
  from?: string;
  to?: string;
  onChange: (next: { from?: string; to?: string }) => void;
  className?: string;
};

export function PersianDateRangePicker({
  from,
  to,
  onChange,
  className,
}: PersianDateRangePickerProps) {
  return (
    <div className={`persian-date-range-picker ${className ?? ''}`.trim()}>
      <PersianDateTimePicker label="از تاریخ" value={from} onChange={(value) => onChange({ from: value, to })} />
      <PersianDateTimePicker label="تا تاریخ" value={to} onChange={(value) => onChange({ from, to: value })} />
    </div>
  );
}
