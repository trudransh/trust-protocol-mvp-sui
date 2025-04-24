'use client'
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particlesRef.current = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 3 + 1.5,
      }));
    };

    const drawParticle = (particle: Particle) => {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      // Using a darker blue that complements the gradient
      ctx.fillStyle = 'rgba(36, 99, 235, 0.6)';
      ctx.fill();
      
      // Add a subtle glow effect
      ctx.shadowColor = 'rgba(36, 99, 235, 0.4)';
      ctx.shadowBlur = 10;
    };

    const drawLines = (particles: Particle[]) => {
      if (!ctx) return;
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(other => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            // Using a darker blue with higher base opacity for lines
            ctx.strokeStyle = `rgba(36, 99, 235, ${0.3 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.8; // Slightly thicker lines
            ctx.stroke();
          }
        });
      });
    };

    const updateParticle = (particle: Particle) => {
      const dx = mouseRef.current.x - particle.x;
      const dy = mouseRef.current.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 200) {
        const force = (200 - distance) * 0.0003;
        particle.vx -= dx * force;
        particle.vy -= dy * force;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off walls
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

      // Apply more friction
      particle.vx *= 0.98;
      particle.vy *= 0.98;
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Reset shadow properties before drawing lines
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      particlesRef.current.forEach(updateParticle);
      drawLines(particlesRef.current);
      particlesRef.current.forEach(drawParticle);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    
    resizeCanvas();
    createParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (

    
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1, 
        mixBlendMode: 'multiply' 
      }} // Explicit negative z-index
    />
  );
}