import React from 'react';
import Skeleton from './Skeleton';
import './SkeletonThemes.css';

export interface SkeletonThemeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Theme preset for different content types
   */
  theme:
  | 'card'
  | 'product'
  | 'article'
  | 'blog-post'
  | 'profile'
  | 'comment'
  | 'list-item'
  | 'table-row'
  | 'form'
  | 'hero'
  | 'about-section'
  | 'feature-card'
  | 'testimonial'
  | 'pricing-card'
  | 'stats'
  | 'team-member'
  | 'gallery-item'
  | 'video-card'
  | 'order-card'
  | 'order-confirmation'
  | 'order-details'
  | 'product-grid'
  | 'content-block'
  | 'cart-list'
  | 'home-page'
  | 'checkout';
  /**
   * Animation type
   * @default 'wave'
   */
  animation?: 'wave' | 'pulse' | 'none';
  /**
   * Number of items to render (for list/grid themes)
   * @default 1
   */
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SkeletonTheme - Pre-built skeleton layouts for common content types
 *
 * Provides ready-to-use skeleton loaders for various content sections
 *
 * @example
 * ```tsx
 * <SkeletonTheme theme="article" />
 * <SkeletonTheme theme="product" count={3} />
 * ```
 */
const SkeletonTheme = React.forwardRef<HTMLDivElement, SkeletonThemeProps>(
  (
    {
      theme,
      animation = 'wave',
      count = 1,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const renderTheme = () => {
      switch (theme) {
        case 'card':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--card">
              <Skeleton variant="rounded" height={200} animation={animation} />
              <div className="lxs-skeleton-theme__content">
                <Skeleton variant="text" width="60%" animation={animation} />
                <Skeleton variant="text" width="90%" animation={animation} />
                <Skeleton variant="text" width="80%" animation={animation} />
              </div>
            </div>
          );

        case 'product':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--product">
              <Skeleton variant="rounded" height={220} animation={animation} />
              <div className="lxs-skeleton-theme__content">
                <Skeleton variant="text" width="50%" height={12} animation={animation} />
                <Skeleton variant="text" width="85%" height={16} animation={animation} />
                <Skeleton variant="text" width="40%" height={12} animation={animation} />
                <Skeleton variant="text" width="60%" height={14} animation={animation} />
                <Skeleton variant="text" width="90%" height={20} animation={animation} />
                <Skeleton variant="rounded" height={40} animation={animation} />
              </div>
            </div>
          );

        case 'article':
        case 'blog-post':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--article">
              <Skeleton variant="text" width="70%" height={32} animation={animation} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Skeleton variant="circular" width={40} height={40} animation={animation} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="30%" animation={animation} />
                  <Skeleton variant="text" width="50%" animation={animation} />
                </div>
              </div>
              <Skeleton variant="rounded" height={300} style={{ marginTop: '20px' }} animation={animation} />
              <div className="lxs-skeleton-theme__content" style={{ marginTop: '20px' }}>
                <Skeleton variant="text" width="100%" animation={animation} />
                <Skeleton variant="text" width="100%" animation={animation} />
                <Skeleton variant="text" width="95%" animation={animation} />
                <Skeleton variant="text" width="100%" animation={animation} />
                <Skeleton variant="text" width="90%" animation={animation} />
                <Skeleton variant="text" width="85%" animation={animation} />
              </div>
            </div>
          );

        case 'profile':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--profile">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Skeleton variant="circular" width={80} height={80} animation={animation} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" height={24} animation={animation} />
                  <Skeleton variant="text" width="60%" animation={animation} />
                  <Skeleton variant="text" width="50%" animation={animation} />
                </div>
              </div>
              <div className="lxs-skeleton-theme__content" style={{ marginTop: '24px' }}>
                <Skeleton variant="text" width="100%" animation={animation} />
                <Skeleton variant="text" width="95%" animation={animation} />
                <Skeleton variant="text" width="90%" animation={animation} />
              </div>
            </div>
          );

        case 'comment':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--comment">
              <div style={{ display: 'flex', gap: '12px' }}>
                <Skeleton variant="circular" width={40} height={40} animation={animation} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="30%" animation={animation} />
                  <Skeleton variant="text" width="100%" animation={animation} />
                  <Skeleton variant="text" width="80%" animation={animation} />
                </div>
              </div>
            </div>
          );

        case 'list-item':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--list-item">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Skeleton variant="rounded" width={60} height={60} animation={animation} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="70%" animation={animation} />
                  <Skeleton variant="text" width="50%" animation={animation} />
                </div>
                <Skeleton variant="text" width={80} animation={animation} />
              </div>
            </div>
          );

        case 'table-row':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--table-row">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Skeleton variant="text" width="20%" animation={animation} />
                <Skeleton variant="text" width="30%" animation={animation} />
                <Skeleton variant="text" width="25%" animation={animation} />
                <Skeleton variant="text" width="15%" animation={animation} />
              </div>
            </div>
          );

        case 'form':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--form">
              <Skeleton variant="text" width="30%" height={14} animation={animation} />
              <Skeleton variant="rounded" height={40} style={{ marginTop: '8px' }} animation={animation} />
              <Skeleton variant="text" width="30%" height={14} style={{ marginTop: '16px' }} animation={animation} />
              <Skeleton variant="rounded" height={40} style={{ marginTop: '8px' }} animation={animation} />
              <Skeleton variant="text" width="30%" height={14} style={{ marginTop: '16px' }} animation={animation} />
              <Skeleton variant="rounded" height={80} style={{ marginTop: '8px' }} animation={animation} />
              <Skeleton variant="rounded" height={44} style={{ marginTop: '20px' }} animation={animation} />
            </div>
          );

        case 'hero':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--hero">
              <Skeleton variant="text" width="60%" height={48} animation={animation} />
              <Skeleton variant="text" width="80%" height={24} style={{ marginTop: '16px' }} animation={animation} />
              <Skeleton variant="text" width="70%" height={24} animation={animation} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <Skeleton variant="rounded" width={150} height={48} animation={animation} />
                <Skeleton variant="rounded" width={150} height={48} animation={animation} />
              </div>
            </div>
          );

        case 'about-section':
        case 'content-block':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--about">
              <Skeleton variant="text" width="50%" height={32} animation={animation} />
              <div className="lxs-skeleton-theme__content" style={{ marginTop: '16px' }}>
                <Skeleton variant="text" width="100%" animation={animation} />
                <Skeleton variant="text" width="100%" animation={animation} />
                <Skeleton variant="text" width="95%" animation={animation} />
                <Skeleton variant="text" width="100%" animation={animation} />
                <Skeleton variant="text" width="90%" animation={animation} />
              </div>
              <Skeleton variant="rounded" height={200} style={{ marginTop: '24px' }} animation={animation} />
              <div className="lxs-skeleton-theme__content" style={{ marginTop: '16px' }}>
                <Skeleton variant="text" width="100%" animation={animation} />
                <Skeleton variant="text" width="95%" animation={animation} />
                <Skeleton variant="text" width="100%" animation={animation} />
              </div>
            </div>
          );

        case 'feature-card':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--feature">
              <Skeleton variant="circular" width={60} height={60} animation={animation} />
              <div className="lxs-skeleton-theme__content" style={{ marginTop: '16px' }}>
                <Skeleton variant="text" width="70%" height={20} animation={animation} />
                <Skeleton variant="text" width="100%" animation={animation} />
                <Skeleton variant="text" width="90%" animation={animation} />
              </div>
            </div>
          );

        case 'testimonial':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--testimonial">
              <div className="lxs-skeleton-theme__content">
                <Skeleton variant="text" width="100%" animation={animation} />
                <Skeleton variant="text" width="95%" animation={animation} />
                <Skeleton variant="text" width="85%" animation={animation} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', alignItems: 'center' }}>
                <Skeleton variant="circular" width={50} height={50} animation={animation} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" animation={animation} />
                  <Skeleton variant="text" width="60%" animation={animation} />
                </div>
              </div>
            </div>
          );

        case 'pricing-card':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--pricing">
              <Skeleton variant="text" width="50%" height={20} animation={animation} />
              <Skeleton variant="text" width="70%" height={48} style={{ marginTop: '12px' }} animation={animation} />
              <Skeleton variant="text" width="60%" style={{ marginTop: '8px' }} animation={animation} />
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Skeleton variant="text" width="80%" animation={animation} />
                <Skeleton variant="text" width="85%" animation={animation} />
                <Skeleton variant="text" width="75%" animation={animation} />
              </div>
              <Skeleton variant="rounded" height={44} style={{ marginTop: '24px' }} animation={animation} />
            </div>
          );

        case 'stats':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--stats">
              <Skeleton variant="text" width="60%" height={40} animation={animation} />
              <Skeleton variant="text" width="80%" style={{ marginTop: '8px' }} animation={animation} />
            </div>
          );

        case 'team-member':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--team">
              <Skeleton variant="rounded" height={250} animation={animation} />
              <div className="lxs-skeleton-theme__content" style={{ marginTop: '16px' }}>
                <Skeleton variant="text" width="70%" height={20} animation={animation} />
                <Skeleton variant="text" width="50%" animation={animation} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Skeleton variant="circular" width={32} height={32} animation={animation} />
                  <Skeleton variant="circular" width={32} height={32} animation={animation} />
                  <Skeleton variant="circular" width={32} height={32} animation={animation} />
                </div>
              </div>
            </div>
          );

        case 'gallery-item':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--gallery">
              <Skeleton variant="rounded" height={280} animation={animation} />
              <div className="lxs-skeleton-theme__content" style={{ marginTop: '12px' }}>
                <Skeleton variant="text" width="80%" animation={animation} />
                <Skeleton variant="text" width="60%" animation={animation} />
              </div>
            </div>
          );

        case 'video-card':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--video">
              <Skeleton variant="rounded" height={200} animation={animation} />
              <div className="lxs-skeleton-theme__content" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Skeleton variant="circular" width={40} height={40} animation={animation} />
                  <div style={{ flex: 1 }}>
                    <Skeleton variant="text" width="90%" animation={animation} />
                    <Skeleton variant="text" width="70%" animation={animation} />
                    <Skeleton variant="text" width="50%" animation={animation} />
                  </div>
                </div>
              </div>
            </div>
          );

        case 'order-card':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--order">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Skeleton variant="text" width="30%" animation={animation} />
                <Skeleton variant="rounded" width={80} height={24} animation={animation} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Skeleton variant="rounded" width={60} height={60} animation={animation} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" animation={animation} />
                  <Skeleton variant="text" width="40%" animation={animation} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" animation={animation} />
                  <Skeleton variant="text" width="40%" animation={animation} />
                </div>
                <Skeleton variant="rounded" width={100} height={32} animation={animation} />
              </div>
            </div>
          );

        case 'order-confirmation':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--order-confirmation" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Skeleton */}
              <div style={{ padding: '24px', backgroundColor: 'var(--lxs-color-neutral-50)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Skeleton variant="circular" width={56} height={56} animation={animation} />
                  <Skeleton variant="text" width="60%" height={32} animation={animation} />
                  <Skeleton variant="text" width="80%" height={16} animation={animation} />
                  <Skeleton variant="rounded" width={200} height={32} animation={animation} />
                </div>
              </div>

              {/* Order Details */}
              <div style={{ padding: '16px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                <Skeleton variant="text" width="40%" height={20} style={{ marginBottom: '12px' }} animation={animation} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton variant="text" width="100%" height={16} animation={animation} />
                  <Skeleton variant="text" width="100%" height={16} animation={animation} />
                  <Skeleton variant="text" width="100%" height={16} animation={animation} />
                </div>
              </div>

              {/* Items */}
              <div style={{ padding: '16px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                <Skeleton variant="text" width="30%" height={20} style={{ marginBottom: '12px' }} animation={animation} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Skeleton variant="rounded" width={64} height={64} animation={animation} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Skeleton variant="text" width="70%" height={16} animation={animation} />
                        <Skeleton variant="text" width="40%" height={14} animation={animation} />
                        <Skeleton variant="text" width="30%" height={14} animation={animation} />
                      </div>
                      <Skeleton variant="text" width={80} height={16} animation={animation} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ padding: '16px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                <Skeleton variant="text" width="40%" height={20} style={{ marginBottom: '12px' }} animation={animation} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton variant="text" width="100%" height={16} animation={animation} />
                  <Skeleton variant="text" width="100%" height={16} animation={animation} />
                  <Skeleton variant="text" width="100%" height={20} animation={animation} />
                </div>
              </div>

              {/* Addresses */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ flex: '1 1 280px', padding: '16px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                    <Skeleton variant="text" width="50%" height={20} style={{ marginBottom: '8px' }} animation={animation} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Skeleton variant="text" width="80%" height={14} animation={animation} />
                      <Skeleton variant="text" width="90%" height={14} animation={animation} />
                      <Skeleton variant="text" width="70%" height={14} animation={animation} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ padding: '16px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Skeleton variant="rounded" height={40} style={{ flex: '1 1 170px' }} animation={animation} />
                  <Skeleton variant="rounded" height={40} style={{ flex: '1 1 170px' }} animation={animation} />
                </div>
              </div>
            </div>
          );

        case 'order-details':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--order-details" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton variant="text" width="40%" height={32} animation={animation} />
                <Skeleton variant="text" width="30%" height={16} animation={animation} />
              </div>

              {/* Timeline */}
              <div style={{ padding: '32px 24px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Skeleton variant="circular" width={40} height={40} animation={animation} />
                      <Skeleton variant="text" width="80%" height={14} animation={animation} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Cards */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ flex: '1 1 200px', minWidth: '200px', padding: '12px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Skeleton variant="text" width="60%" height={12} animation={animation} />
                      <Skeleton variant="text" width="80%" height={20} animation={animation} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Skeleton variant="rounded" height={40} style={{ flex: '1 1 180px' }} animation={animation} />
                <Skeleton variant="rounded" height={40} style={{ flex: '1 1 180px' }} animation={animation} />
              </div>

              {/* Items */}
              <div style={{ padding: '16px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                <Skeleton variant="text" width="30%" height={20} style={{ marginBottom: '12px' }} animation={animation} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Skeleton variant="rounded" width={64} height={64} animation={animation} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Skeleton variant="text" width="70%" height={16} animation={animation} />
                        <Skeleton variant="text" width="40%" height={14} animation={animation} />
                        <Skeleton variant="text" width="30%" height={14} animation={animation} />
                      </div>
                      <Skeleton variant="text" width={80} height={16} animation={animation} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ padding: '16px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                <Skeleton variant="text" width="40%" height={20} style={{ marginBottom: '12px' }} animation={animation} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton variant="text" width="100%" height={16} animation={animation} />
                  <Skeleton variant="text" width="100%" height={16} animation={animation} />
                  <Skeleton variant="text" width="100%" height={20} animation={animation} />
                </div>
              </div>

              {/* Addresses */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ flex: '1 1 280px', padding: '16px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                    <Skeleton variant="text" width="50%" height={20} style={{ marginBottom: '8px' }} animation={animation} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <Skeleton variant="text" width="80%" height={14} animation={animation} />
                      <Skeleton variant="text" width="90%" height={14} animation={animation} />
                      <Skeleton variant="text" width="70%" height={14} animation={animation} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ padding: '16px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '8px' }}>
                <Skeleton variant="text" width="40%" height={20} style={{ marginBottom: '12px' }} animation={animation} />
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Skeleton variant="rounded" height={40} style={{ flex: '1 1 160px' }} animation={animation} />
                  <Skeleton variant="rounded" height={40} style={{ flex: '1 1 160px' }} animation={animation} />
                  <Skeleton variant="rounded" height={40} style={{ flex: '1 1 160px' }} animation={animation} />
                </div>
              </div>
            </div>
          );

        case 'product-grid':
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="lxs-skeleton-theme lxs-skeleton-theme--product-grid">
                  <Skeleton variant="rounded" height={200} animation={animation} />
                  <div style={{ padding: '12px' }}>
                    <Skeleton variant="text" width="70%" animation={animation} />
                    <Skeleton variant="text" width="50%" animation={animation} />
                    <Skeleton variant="text" width="80%" height={20} style={{ marginTop: '8px' }} animation={animation} />
                  </div>
                </div>
              ))}
            </div>
          );

        case 'cart-list':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--cart-list">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Skeleton variant="rounded" width={80} height={80} animation={animation} />
                <div style={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={20} animation={animation} />
                  <Skeleton variant="text" width="40%" height={16} style={{ marginTop: '8px' }} animation={animation} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <Skeleton variant="rounded" width={100} height={32} animation={animation} />
                  <Skeleton variant="text" width={80} height={20} animation={animation} />
                </div>
              </div>
            </div>
          );



        case 'home-page':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--home-page">
              {/* Carousel Section */}
              <div className="lxs-skeleton-theme--home-page__carousel">
                <Skeleton variant="rectangular" width="100%" height={400} animation={animation} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} variant="circular" width={8} height={8} animation={animation} />
                  ))}
                </div>
              </div>

              {/* Categories Section */}
              <div>
                <Skeleton variant="text" width={200} height={24} style={{ marginBottom: '16px' }} animation={animation} />
                <div className="lxs-skeleton-theme--home-page__categories">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
                      <Skeleton variant="circular" width={60} height={60} animation={animation} />
                      <Skeleton variant="text" width="80%" animation={animation} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured Products Section */}
              <div>
                <Skeleton variant="text" width={250} height={24} style={{ marginBottom: '16px' }} animation={animation} />
                <div className="lxs-skeleton-theme--home-page__grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '12px', overflow: 'hidden' }}>
                      <Skeleton variant="rectangular" height={200} animation={animation} />
                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Skeleton variant="text" width="90%" animation={animation} />
                        <Skeleton variant="text" width="60%" animation={animation} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                          <Skeleton variant="text" width={60} height={24} animation={animation} />
                          <Skeleton variant="rounded" width={32} height={32} animation={animation} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );

        case 'checkout':
          return (
            <div className="lxs-skeleton-theme lxs-skeleton-theme--checkout">
              {/* Main Section - Forms */}
              <div className="lxs-skeleton-theme--checkout__main">
                {/* Shipping Address */}
                <div style={{ padding: '24px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '12px' }}>
                  <Skeleton variant="text" width="40%" height={24} style={{ marginBottom: '24px' }} animation={animation} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <Skeleton variant="rounded" height={44} style={{ gridColumn: '1 / -1' }} animation={animation} />
                    <Skeleton variant="rounded" height={44} style={{ gridColumn: '1 / -1' }} animation={animation} />
                    <Skeleton variant="rounded" height={44} animation={animation} />
                    <Skeleton variant="rounded" height={44} animation={animation} />
                    <Skeleton variant="rounded" height={44} style={{ gridColumn: '1 / -1' }} animation={animation} />
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ padding: '24px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '12px' }}>
                  <Skeleton variant="text" width="30%" height={24} style={{ marginBottom: '24px' }} animation={animation} />
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <Skeleton variant="rounded" width={80} height={50} animation={animation} />
                    <Skeleton variant="rounded" width={80} height={50} animation={animation} />
                    <Skeleton variant="rounded" width={80} height={50} animation={animation} />
                  </div>
                  <Skeleton variant="rounded" height={44} style={{ marginBottom: '16px' }} animation={animation} />
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Skeleton variant="rounded" height={44} style={{ flex: 1 }} animation={animation} />
                    <Skeleton variant="rounded" height={44} style={{ flex: 1 }} animation={animation} />
                  </div>
                </div>
              </div>

              {/* Sidebar - Order Summary */}
              <div className="lxs-skeleton-theme--checkout__sidebar">
                <div style={{ padding: '24px', border: '1px solid var(--lxs-color-neutral-200)', borderRadius: '12px', position: 'sticky', top: '24px' }}>
                  <Skeleton variant="text" width="60%" height={24} style={{ marginBottom: '24px' }} animation={animation} />

                  {/* Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={{ display: 'flex', gap: '12px' }}>
                        <Skeleton variant="rounded" width={60} height={60} animation={animation} />
                        <div style={{ flex: 1 }}>
                          <Skeleton variant="text" width="80%" animation={animation} />
                          <Skeleton variant="text" width="40%" style={{ marginTop: '4px' }} animation={animation} />
                        </div>
                        <Skeleton variant="text" width={50} animation={animation} />
                      </div>
                    ))}
                  </div>

                  <Skeleton variant="rectangular" height={1} style={{ marginBottom: '24px' }} animation={animation} />

                  {/* Totals */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Skeleton variant="text" width="40%" animation={animation} />
                      <Skeleton variant="text" width="20%" animation={animation} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Skeleton variant="text" width="40%" animation={animation} />
                      <Skeleton variant="text" width="20%" animation={animation} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <Skeleton variant="text" width="50%" height={20} animation={animation} />
                      <Skeleton variant="text" width="30%" height={20} animation={animation} />
                    </div>
                  </div>

                  <Skeleton variant="rounded" height={48} animation={animation} />
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    // For themes that support count > 1
    if (count > 1 && !['product-grid'].includes(theme)) {
      return (
        <div
          ref={ref}
          className={`lxs-skeleton-theme-container ${className}`}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', ...style }}
          {...props}
        >
          {Array.from({ length: count }).map((_, i) => (
            <React.Fragment key={i}>{renderTheme()}</React.Fragment>
          ))}
        </div>
      );
    }

    return (
      <div ref={ref} className={className} style={style} {...props}>
        {renderTheme()}
      </div>
    );
  }
);

SkeletonTheme.displayName = 'SkeletonTheme';

export default SkeletonTheme;
export { SkeletonTheme };
