'use client';

import { useState } from 'react';
import { ModalPortal } from './modal-portal';
import { detectBank } from '../../lib/utils/bank';

export interface ContactInfo {
  id: string;
  nickname: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  cardNumber?: string | null;
  shaba?: string | null;
}

interface Props {
  info: ContactInfo;
  title?: string;
  label?: string;
  onClose: () => void;
  onCopy?: (text: string) => void;
}

const copyText = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
};

export function ContactDetailModal({
  info,
  title = 'مشخصات تماس و کارت',
  label,
  onClose,
  onCopy,
}: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, value: string) => {
    await copyText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    onCopy?.(value);
  };

  const bankName = info.cardNumber ? detectBank(info.cardNumber) : null;

  return (
    <ModalPortal>
      <div
        className="modal-root"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          type="button"
          className="modal-backdrop"
          aria-label="بستن"
          onClick={onClose}
        />
        <div className="modal-card card">
          <div className="modal-header">
            <h2 className="card-title">{title}</h2>
            <button type="button" className="sidebar-close" aria-label="بستن" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="stack">
            {label ? <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>{label}</p> : null}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem',
                background: 'var(--neu-bg)',
                boxShadow: '2px 2px 4px var(--neu-shadow-dark), -2px -2px 4px var(--neu-shadow-light)',
                borderRadius: '0.75rem',
              }}
            >
              <div className="member-avatar">
                {info.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={info.avatarUrl} alt={info.nickname} className="member-avatar-image" />
                ) : (
                  info.nickname.slice(0, 1)
                )}
              </div>
              <div>
                <p className="member-name" style={{ margin: 0 }}>{info.nickname}</p>
                <p className="member-contact" style={{ margin: 0 }}>
                  {info.email || 'بدون اطلاعات تماس'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: "column", width: "100%", gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'start' }}>
              <p className="member-contact" style={{ margin: 0 }}>شماره کارت</p>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center",justifyContent:"space-between", width:"100%" }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: "start", }}>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center",gap:"4px" }}>

                  <p className="card-number">{info.cardNumber || 'ثبت نشده'}</p>
                  {bankName ? (
                    <p style={{ margin: '0', fontSize: '0.85rem', color:"var(--accent)" }}>بانک {bankName}</p>
                  ) : null}</div>
                </div>
              <button
                type="button"
                style={{width:"fit-content"}}
                className="btn btn-secondary"
                disabled={!info.cardNumber}
                onClick={() => info.cardNumber && handleCopy('card', info.cardNumber)}
              >
                {copiedKey === 'card' ? 'کپی شد ✓' : 'کپی'}
              </button>
              </div>
            </div>


            {info.shaba && <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <div>
                <p className="member-contact" style={{ margin: 0 }}>شماره شبا</p>
                <p className="card-number">{info.shaba || 'ثبت نشده'}</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!info.shaba}
                onClick={() => info.shaba && handleCopy('shaba', info.shaba)}
              >
                {copiedKey === 'shaba' ? 'کپی شد ✓' : 'کپی'}
              </button>
            </div>}

            <p className="hint" style={{ margin: 0 }}>
              این اطلاعات فقط برای خودت، دوستان و اعضای همان گروه نمایش داده می‌شود.
            </p>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
