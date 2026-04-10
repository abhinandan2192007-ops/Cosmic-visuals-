import { useEffect, useRef } from 'react';

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number; y: number; z: number; size: number; opacity: number }[] = [];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const numStars = Math.floor((canvas.width * canvas.height) / 2000);
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width - canvas.width / 2,
          y: Math.random() * canvas.height - canvas.height / 2,
          z: Math.random() * 1000,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random()
        });
      }
    };

    const draw = () => {
      ctx.fillStyle = '#05050a'; // Match --color-space-950
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      stars.forEach((star) => {
        star.z -= 0.5; // Speed of stars moving towards viewer
        
        if (star.z <= 0) {
          star.x = Math.random() * canvas.width - cx;
          star.y = Math.random() * canvas.height - cy;
          star.z = 1000;
        }

        const x = cx + (star.x / star.z) * 1000;
        const y = cy + (star.y / star.z) * 1000;
        
        // Calculate size based on depth
        const s = (1 - star.z / 1000) * star.size * 3;

        // Don't draw if outside canvas
        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * (1 - star.z / 1000)})`;
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: '#05050a' }}
    />
  );
}
