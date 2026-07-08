import React from 'react';
import { BRAND_COLORS } from '../utils/brandAssets';

const SIZE_STYLES = {
  sm: {
    main: 'text-sm',
    sub: 'text-[8px] tracking-[0.24em]',
  },
  md: {
    main: 'text-xl',
    sub: 'text-[10px] tracking-[0.28em]',
  },
  lg: {
    main: 'text-2xl',
    sub: 'text-xs tracking-[0.32em]',
  },
};

const BrandTitle = ({ size = 'md', layout = 'stacked', className = '' }) => {
  const styles = SIZE_STYLES[size] || SIZE_STYLES.md;

  if (layout === 'inline') {
    return (
      <span className={`font-black tracking-tight ${styles.main} ${className}`}>
        <span style={{ color: BRAND_COLORS.navy }}>Harihar</span>{' '}
        <span style={{ color: BRAND_COLORS.orange }}>Printers</span>
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
        style={{ color: BRAND_COLORS.orange }}
      >
        PRINTERS
      </div>
    </div>
  );
};

export default BrandTitle;
