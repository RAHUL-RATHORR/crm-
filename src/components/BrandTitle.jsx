import React from 'react';
import { BRAND_COLORS } from '../utils/brandAssets';

const SIZE_STYLES = {
  sm: {
    main: 'text-[14px] leading-none',
    sub: 'text-[8.5px] tracking-[0.32em]',
  },
  md: {
    main: 'text-[22px] leading-none',
    sub: 'text-[10px] tracking-[0.36em]',
  },
  lg: {
    main: 'text-[26px] leading-none',
    sub: 'text-[11px] tracking-[0.40em]',
  },
};

const FONT_STACK = '"Georgia", "Times New Roman", Times, serif';

const BrandTitle = ({ size = 'md', layout = 'stacked', className = '' }) => {
  const styles = SIZE_STYLES[size] || SIZE_STYLES.md;

  if (layout === 'inline') {
    return (
      <span
        className={`font-extrabold tracking-[-0.03em] ${styles.main} ${className}`}
        style={{ fontFamily: FONT_STACK }}
      >
        <span style={{ color: BRAND_COLORS.navy }}>Harihar</span>{' '}
        <span style={{ color: BRAND_COLORS.teal }}>Printers</span>
      </span>
    );
  }

  return (
    <div className={`text-left leading-tight ${className}`}>
      <div
        className={`${styles.main} font-extrabold tracking-[-0.03em]`}
        style={{ color: BRAND_COLORS.navy, fontFamily: FONT_STACK }}
      >
        HARIHAR
      </div>
      <div
        className={`${styles.sub} font-semibold uppercase`}
        style={{ color: BRAND_COLORS.teal }}
      >
        PRINTERS
      </div>
    </div>
  );
};

export default BrandTitle;
