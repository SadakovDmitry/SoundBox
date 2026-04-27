import { useEffect, useRef } from 'react';

const reduceMotionQuery = '(prefers-reduced-motion: reduce)';

export default function CursorComet() {
  const glowRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(reduceMotionQuery).matches;
    const pointerFine = window.matchMedia('(pointer: fine)').matches;
    if (reduceMotion || !pointerFine) return undefined;

    const container = containerRef.current;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let lastSparkAt = 0;
    let frame = 0;

    const moveGlow = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(moveGlow);
    };

    const createSpark = (x, y) => {
      if (!container) return;
      const spark = document.createElement('span');
      const size = 8 + Math.random() * 14;
      const driftX = (Math.random() - 0.5) * 34;
      const driftY = (Math.random() - 0.5) * 34;

      spark.className = 'cursor-comet__spark';
      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.setProperty('--spark-x', `${driftX}px`);
      spark.style.setProperty('--spark-y', `${driftY}px`);
      container.appendChild(spark);
      spark.addEventListener('animationend', () => spark.remove(), { once: true });
    };

    const handlePointerMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;

      const now = performance.now();
      if (now - lastSparkAt > 28) {
        createSpark(event.clientX, event.clientY);
        lastSparkAt = now;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    frame = requestAnimationFrame(moveGlow);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(frame);
      container?.replaceChildren();
    };
  }, []);

  return (
    <div className="cursor-comet" ref={containerRef} aria-hidden="true">
      <div className="cursor-comet__glow" ref={glowRef} />
    </div>
  );
}
