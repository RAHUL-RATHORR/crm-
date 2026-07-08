import React from 'react';
import { BRAND_COLORS } from '../utils/brandAssets';

const SIZE_STYLES = {
  sm: {
    main: 'text-[15px] leading-none',
    sub: 'text-[9px] tracking-[0.30em]',
  },
  md: {
    main: 'text-2xl leading-none',
    sub: 'text-[11px] tracking-[0.34em]',
  },
  lg: {
    main: 'text-3xl leading-none',
    sub: 'text-[12px] tracking-[0.38em]',
  },
};

const BrandTitle = ({ size = 'md', layout = 'stacked', className = '' }) => {
  const styles = SIZE_STYLES[size] || SIZE_STYLES.md;

  if (layout === 'inline') {
    return (
      <span className={`font-black tracking-[-0.02em] ${styles.main} ${className}`}>
        <span style={{ color: BRAND_COLORS.navy }}>Harihar</span>{' '}
        <span style={{ color: BRAND_COLORS.teal }}>Printers</span>
      </span>
    );
  }

  return (
    <div className={`text-left leading-tight ${className}`}>
      <div
        className={`${styles.main} font-black tracking-tight`}
        style={{ color: BRAND_COLORS.navy }}
      >
        HARIHAR
      </div>
      <div
        className={`${styles.sub} font-bold uppercase`}
        style={{ color: BRAND_COLORS.teal }}
      >
        PRINTERS
      </div>
    </div>
  );
};

export default BrandTitle;
