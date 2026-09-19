// src/styles/tourStyles.jsx
import React from 'react';

export const TOUR_STYLES = {
  options: {
    primaryColor: '#0D4F3C', // ProTech forest green
    backgroundColor: '#FFFFFF',
    textColor: '#1E293B',
    arrowColor: '#FFFFFF',
    overlayColor: 'rgba(10, 61, 46, 0.72)',
    zIndex: 10000,
    width: 380,
  },
  tooltip: {
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    border: '1px solid #E2E8F0',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0A3D2E',
    marginBottom: '8px',
    fontFamily: 'inherit',
  },
  tooltipContent: {
    fontSize: '14px',
    lineHeight: '1.65',
    color: '#475569',
    fontFamily: 'inherit',
  },
  buttonNext: {
    backgroundColor: '#0D4F3C',
    borderRadius: '10px',
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '700',
    border: 'none',
    color: '#FFFFFF',
  },
  buttonBack: {
    color: '#64748B',
    fontSize: '13px',
    fontWeight: '600',
    marginRight: '8px',
  },
  buttonSkip: {
    color: '#94A3B8',
    fontSize: '13px',
  },
  buttonClose: {
    color: '#94A3B8',
  },
  beacon: {
    inner: '#D97706', // gold pulse
    outer: '#D97706',
  },
  spotlight: {
    borderRadius: '12px',
  },
};

// Custom tooltip component with progress bar
export const TourTooltip = ({
  continuous,
  index,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}) => (
  <div
    {...tooltipProps}
    style={{
      background: '#FFFFFF',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '380px',
      boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      border: '1px solid #E2E8F0',
    }}
  >
    {/* Header */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          background: '#F0FDF4',
          color: '#0D4F3C',
          fontSize: '11px',
          fontWeight: '700',
          padding: '4px 10px',
          borderRadius: '20px',
          border: '1px solid #BBF7D0',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Step {index + 1} of {size}
      </div>
      <button
        {...closeProps}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#94A3B8',
          fontSize: '18px',
          lineHeight: '1',
          padding: '0 4px',
        }}
      >
        ×
      </button>
    </div>

    {/* Progress bar */}
    <div
      style={{
        height: '4px',
        background: '#F1F5F9',
        borderRadius: '4px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          height: '4px',
          background: 'linear-gradient(90deg, #0D4F3C, #D97706)',
          borderRadius: '4px',
          width: `${((index + 1) / size) * 100}%`,
          transition: 'width 0.3s ease',
        }}
      />
    </div>

    {/* Title */}
    {step.title && (
      <h3
        style={{
          fontSize: '16px',
          fontWeight: '800',
          color: '#0A3D2E',
          marginBottom: '8px',
          margin: '0 0 8px 0',
        }}
      >
        {step.title}
      </h3>
    )}

    {/* Content */}
    <div
      style={{
        fontSize: '13.5px',
        lineHeight: '1.65',
        color: '#475569',
        marginBottom: '20px',
        whiteSpace: 'pre-line',
      }}
    >
      {step.content}
    </div>

    {/* Buttons */}
    <div
      style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
      }}
    >
      <button
        {...skipProps}
        style={{
          background: 'none',
          border: 'none',
          color: '#94A3B8',
          fontSize: '12px',
          cursor: 'pointer',
          padding: '0',
        }}
      >
        Skip tour
      </button>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {index > 0 && (
          <button
            {...backProps}
            style={{
              background: 'none',
              border: '1px solid #E2E8F0',
              color: '#64748B',
              fontSize: '13px',
              fontWeight: '600',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            Back
          </button>
        )}
        <button
          {...primaryProps}
          style={{
            background: '#0D4F3C',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: '700',
            borderRadius: '10px',
            padding: '10px 20px',
            cursor: 'pointer',
          }}
        >
          {continuous && index < size - 1 ? 'Next →' : 'Finish ✓'}
        </button>
      </div>
    </div>
  </div>
);
