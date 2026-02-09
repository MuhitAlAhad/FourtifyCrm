import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Trash2, CheckCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  if (typeof document === 'undefined') return null;

  const variantStyles = {
    danger: {
      icon: Trash2,
      iconColor: '#ef4444',
      iconBg: 'rgba(239, 68, 68, 0.1)',
      buttonBg: '#ef4444',
      buttonHoverBg: '#dc2626'
    },
    warning: {
      icon: AlertCircle,
      iconColor: '#f59e0b',
      iconBg: 'rgba(245, 158, 11, 0.1)',
      buttonBg: '#f59e0b',
      buttonHoverBg: '#d97706'
    },
    info: {
      icon: Info,
      iconColor: '#3b82f6',
      iconBg: 'rgba(59, 130, 246, 0.1)',
      buttonBg: '#3b82f6',
      buttonHoverBg: '#2563eb'
    },
    success: {
      icon: CheckCircle,
      iconColor: '#00ff88',
      iconBg: 'rgba(0, 255, 136, 0.1)',
      buttonBg: '#00ff88',
      buttonHoverBg: '#00cc6a'
    }
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  const dialog = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a2332',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          border: '2px solid #2a3442',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          animation: 'slideIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>
          {`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: scale(0.95) translateY(-20px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
          `}
        </style>

        {/* Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: style.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}
        >
          <Icon size={28} color={style.iconColor} />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '12px'
          }}
        >
          {title}
        </h2>

        {/* Message */}
        <div
          style={{
            fontSize: '16px',
            color: '#9ca3af',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}
        >
          {message}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0f1623',
              color: 'white',
              border: '2px solid #2a3442',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a2332';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0f1623';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: style.buttonBg,
              color: variant === 'success' ? '#0a0f1a' : 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = style.buttonHoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = style.buttonBg;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
