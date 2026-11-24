import { useRef } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

/**
 * Pointer-driven 3D tilt. Motion values stay outside React state so the page
 * keeps its frame budget; reduced-motion users get the flat surface instead.
 */
export default function Tilt3D({ children, className = '', max = 6, glare = true }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const spring = { stiffness: 220, damping: 26, mass: 0.5 };
  const springX = useSpring(pointerX, spring);
  const springY = useSpring(pointerY, spring);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-max, max]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [max, -max]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const handlePointerMove = (event) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    pointerX.set(x - 0.5);
    pointerY.set(y - 0.5);
    ref.current.style.setProperty('--tilt-gx', `${x * 100}%`);
    ref.current.style.setProperty('--tilt-gy', `${y * 100}%`);
  };

  const reset = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`tilt3d ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      {children}
      {glare ? <span className="tilt3d__glare" aria-hidden="true" /> : null}
    </motion.div>
  );
}
