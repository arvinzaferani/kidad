'use client';

import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Download, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

const highlights = [
  {
    title: 'تقسیم هزینه‌ها',
    description: 'خرج‌های سفر، مهمانی و زندگی مشترک را در چند ثانیه ثبت کن.',
  },
  {
    title: 'مانده‌های شفاف',
    description: 'ببین چه کسی بدهکار است و چه کسی طلبکار، بدون حساب‌وکتاب دستی.',
  },
  {
    title: 'دسترسی ساده',
    description: 'از وب وارد شو، گروه بساز و همه چیز را از هر دستگاهی دنبال کن.',
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, staggerChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export function GlowyWavesHero() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const [deferredPrompt, setDeferredPrompt] =
    useState<Event | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    const result = await (deferredPrompt as any).userChoice;
    if (result.outcome === 'accepted') setDeferredPrompt(null);
  }, [deferredPrompt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const computeThemeColors = () => {
      const rootStyles = getComputedStyle(document.documentElement);

      const resolveColor = (variables: string[], alpha = 1) => {
        const tempEl = document.createElement('div');
        tempEl.style.position = 'absolute';
        tempEl.style.visibility = 'hidden';
        tempEl.style.width = '1px';
        tempEl.style.height = '1px';
        document.body.appendChild(tempEl);

        let color = `rgba(255, 255, 255, ${alpha})`;

        for (const variable of variables) {
          const value = rootStyles.getPropertyValue(variable).trim();
          if (value) {
            tempEl.style.backgroundColor = `var(${variable})`;
            const computedColor = getComputedStyle(tempEl).backgroundColor;
            if (computedColor && computedColor !== 'rgba(0, 0, 0, 0)') {
              if (alpha < 1) {
                const rgbMatch = computedColor.match(
                  /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/,
                );
                if (rgbMatch) {
                  color = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
                } else {
                  color = computedColor;
                }
              } else {
                color = computedColor;
              }
              break;
            }
          }
        }

        document.body.removeChild(tempEl);
        return color;
      };

      return {
        backgroundTop: resolveColor(['--background'], 1),
        backgroundBottom: resolveColor(['--muted', '--background'], 0.95),
        wavePalette: [
          {
            offset: 0,
            amplitude: 70,
            frequency: 0.003,
            color: resolveColor(['--primary'], 0.8),
            opacity: 0.45,
          },
          {
            offset: Math.PI / 2,
            amplitude: 90,
            frequency: 0.0026,
            color: resolveColor(['--accent', '--primary'], 0.7),
            opacity: 0.35,
          },
          {
            offset: Math.PI,
            amplitude: 60,
            frequency: 0.0034,
            color: resolveColor(['--secondary', '--foreground'], 0.65),
            opacity: 0.3,
          },
          {
            offset: Math.PI * 1.5,
            amplitude: 80,
            frequency: 0.0022,
            color: resolveColor(['--primary-foreground', '--foreground'], 0.25),
            opacity: 0.25,
          },
          {
            offset: Math.PI * 2,
            amplitude: 55,
            frequency: 0.004,
            color: resolveColor(['--foreground'], 0.2),
            opacity: 0.2,
          },
        ],
      };
    };

    let themeColors = computeThemeColors();

    const handleThemeMutation = () => {
      themeColors = computeThemeColors();
    };

    const observer = new MutationObserver(handleThemeMutation);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const mouseInfluence = prefersReducedMotion ? 10 : 70;
    const influenceRadius = prefersReducedMotion ? 160 : 320;
    const smoothing = prefersReducedMotion ? 0.04 : 0.1;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const recenterMouse = () => {
      const centerPoint = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = centerPoint;
      targetMouseRef.current = centerPoint;
    };

    const handleResize = () => {
      resizeCanvas();
      recenterMouse();
    };

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseLeave = () => {
      recenterMouse();
    };

    resizeCanvas();
    recenterMouse();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const drawWave = (wave: (typeof themeColors.wavePalette)[number]) => {
      ctx.save();
      ctx.beginPath();

      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / influenceRadius);
        const mouseEffect =
          influence *
          mouseInfluence *
          Math.sin(time * 0.001 + x * 0.01 + wave.offset);

        const y =
          canvas.height / 2 +
          Math.sin(x * wave.frequency + time * 0.002 + wave.offset) *
          wave.amplitude +
          Math.sin(x * wave.frequency * 0.4 + time * 0.003) *
          (wave.amplitude * 0.45) +
          mouseEffect;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.shadowBlur = 35;
      ctx.shadowColor = wave.color;
      ctx.stroke();

      ctx.restore();
    };

    const animate = () => {
      time += 1;

      mouseRef.current.x +=
        (targetMouseRef.current.x - mouseRef.current.x) * smoothing;
      mouseRef.current.y +=
        (targetMouseRef.current.y - mouseRef.current.y) * smoothing;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, themeColors.backgroundTop);
      gradient.addColorStop(1, themeColors.backgroundBottom);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      themeColors.wavePalette.forEach(drawWave);

      animationId = window.requestAnimationFrame(animate);
    };

    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      className="relative isolate flex w-full flex-col items-center overflow-hidden bg-background"
      role="region"
      aria-label="بخش قهرمان امواج درخشان"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      <div className="hero-content" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, margin: '0 auto', display: 'flex', width: '100%', maxWidth: '72rem', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '6rem 1.5rem' }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', width: '100%', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
        >
          <motion.div
            variants={itemVariants}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '9999px', border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)', padding: '0.5rem 1rem', backdropFilter: 'blur(4px)', marginBottom: '1.5rem', backgroundColor: 'var(--background)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--foreground)', opacity: 0.7 }}
          >
            <Sparkles style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} aria-hidden="true" />
            کی‌داد؟ · نسخه وب
          </motion.div>

          <motion.h1
            variants={itemVariants}
            style={{ marginBottom: '1.5rem', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: 'var(--foreground)', fontWeight: 600, letterSpacing: '-0.025em' }}
          >
            خرج‌های مشترک را{' '}
            <span style={{ background: 'linear-gradient(to right, var(--primary), color-mix(in srgb, var(--primary) 60%, transparent), color-mix(in srgb, var(--foreground) 80%, transparent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ساده و شفاف
            </span>{' '}
            مدیریت کن
          </motion.h1>

          <motion.p
            variants={itemVariants}
            style={{ margin: '0 auto 2.5rem', maxWidth: '48rem', fontSize: 'clamp(1rem, 2.2vw, 1.5rem)', color: 'var(--foreground)', opacity: 0.7 }}
          >
            برای سفرها، خانه و جمع‌های دوستانه. هزینه‌ها را ثبت کن، مانده‌ها را
            ببین و بدون دردسر تسویه کن.
          </motion.p>

          <motion.div
            variants={itemVariants}
            style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            {deferredPrompt && (
              <Button onClick={handleInstall}>
                <Download style={{ width: '1rem', height: '1rem' }} aria-hidden="true" />
                نصب اپ
              </Button>
            )}
            <Button onClick={() => router.push('/login')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', border: 'none', borderRadius: '24px', height: '40px', padding: '0 1.5rem', backgroundColor: 'white', color: 'var(--primary-foreground)', width: '160px' }}>
            <ArrowRight style={{ width: '1rem', height: '1rem', transition: 'transform 0.15s' }} aria-hidden="true" />

              شروع کن
            </Button>
            <Button style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', borderRadius: '24px', height: '40px', padding: '0 1.5rem', backgroundColor: '#00000000', color: 'white', width: '160px', border:'solid 1px white' }}
            variant="outline" onClick={() => router.push('/dashboard')}>
              دیدن داشبورد
            </Button>
          </motion.div>

     
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderRadius: '1rem', border: '1px solid color-mix(in srgb, var(--border) 30%, transparent)', padding: '1.5rem', backdropFilter: 'blur(4px)', backgroundColor: 'var(--background)' }}
        >
          {highlights.map((item, i) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              style={{ textAlign: 'right' }}
            >
              <div
                style={{ fontSize: '0.75rem', letterSpacing: '0.3em', color: 'var(--foreground)', opacity: 0.5, marginBottom: '0.25rem', textTransform: 'uppercase' }}
              >
                {item.title}
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.625, color: 'var(--foreground)', opacity: 0.7 }}>
                {item.description}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
