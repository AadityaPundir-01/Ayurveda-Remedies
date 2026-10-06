import React, { useEffect, useRef } from "react";

/**
 * GreeneryBackground
 * An organic, ambient botanical canvas with gentle floating herbal leaves,
 * pollen sparkles, and serene nature glow orbs.
 */
export function GreeneryBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Leaf particle definition
    const LEAF_COUNT = 24;
    const SPARKLE_COUNT = 30;

    // Organic botanical leaf shapes
    class Leaf {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : -30;
        this.size = 12 + Math.random() * 18;
        this.speedY = 0.4 + Math.random() * 0.8;
        this.speedX = (Math.random() - 0.5) * 0.6;
        this.angle = Math.random() * Math.PI * 2;
        this.angularSpeed = (Math.random() - 0.5) * 0.02;
        this.sway = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.015 + Math.random() * 0.02;
        this.opacity = 0.15 + Math.random() * 0.25;
        // Palettes of Ayurvedic leaves: emerald, sage, jade, golden lime
        const greenTones = [
          "rgba(16, 149, 90, ",   // emerald
          "rgba(5, 122, 85, ",    // deep jade
          "rgba(52, 199, 89, ",   // fresh spring leaf
          "rgba(101, 163, 13, ",  // herbal olive-lime
          "rgba(13, 148, 136, ",  // ocean mint
        ];
        this.colorPrefix = greenTones[Math.floor(Math.random() * greenTones.length)];
        this.type = Math.floor(Math.random() * 3); // 0: Oval (Tulsi), 1: Serrated/Neem-like, 2: Heart (Giloy)
      }

      update() {
        this.y += this.speedY;
        this.sway += this.swaySpeed;
        this.x += Math.sin(this.sway) * 0.9 + this.speedX;
        this.angle += this.angularSpeed;

        if (this.y > height + 40 || this.x < -40 || this.x > width + 40) {
          this.reset(false);
        }
      }

      draw(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);
        c.fillStyle = `${this.colorPrefix}${this.opacity})`;
        c.strokeStyle = `${this.colorPrefix}${this.opacity * 1.3})`;
        c.lineWidth = 1;

        c.beginPath();
        if (this.type === 0) {
          // Classic oval herbal leaf (Tulsi)
          c.ellipse(0, 0, this.size * 0.5, this.size, 0, 0, Math.PI * 2);
          c.fill();
          // Center vein
          c.beginPath();
          c.moveTo(0, -this.size * 0.9);
          c.lineTo(0, this.size * 0.9);
          c.stroke();
        } else if (this.type === 1) {
          // Serrated lanceolate leaf (Neem)
          c.moveTo(0, -this.size);
          c.quadraticCurveTo(this.size * 0.45, -this.size * 0.2, 0, this.size);
          c.quadraticCurveTo(-this.size * 0.45, -this.size * 0.2, 0, -this.size);
          c.fill();
          // Stem
          c.beginPath();
          c.moveTo(0, -this.size);
          c.lineTo(0, this.size * 1.15);
          c.stroke();
        } else {
          // Heart-shaped leaf (Guduchi / Giloy)
          const s = this.size * 0.6;
          c.moveTo(0, s * 0.3);
          c.bezierCurveTo(s * 0.8, -s * 0.9, s * 1.6, s * 0.2, 0, s * 1.4);
          c.bezierCurveTo(-s * 1.6, s * 0.2, -s * 0.8, -s * 0.9, 0, s * 0.3);
          c.fill();
        }

        c.restore();
      }
    }

    // Herbal Pollen / Spores
    class Pollen {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 10;
        this.radius = 1 + Math.random() * 2;
        this.speedY = -(0.2 + Math.random() * 0.5);
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.alpha = 0.1 + Math.random() * 0.3;
        this.pulse = Math.random() * Math.PI;
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.pulse += 0.03;
        if (this.y < -10) this.reset(false);
      }

      draw(c) {
        const curAlpha = Math.max(0.05, this.alpha * Math.abs(Math.sin(this.pulse)));
        c.save();
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = `rgba(217, 119, 6, ${curAlpha})`; // Golden turmeric glow
        c.shadowColor = "rgba(245, 158, 11, 0.4)";
        c.shadowBlur = 4;
        c.fill();
        c.restore();
      }
    }

    const leaves = Array.from({ length: LEAF_COUNT }, () => new Leaf());
    const pollens = Array.from({ length: SPARKLE_COUNT }, () => new Pollen());

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle ambient glow orbs in corners
      const grad1 = ctx.createRadialGradient(width * 0.1, height * 0.15, 20, width * 0.1, height * 0.15, 450);
      grad1.addColorStop(0, "rgba(209, 250, 229, 0.45)");
      grad1.addColorStop(1, "rgba(209, 250, 229, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.9, height * 0.4, 20, width * 0.9, height * 0.4, 500);
      grad2.addColorStop(0, "rgba(254, 243, 199, 0.35)");
      grad2.addColorStop(1, "rgba(254, 243, 199, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Render leaves and pollen
      pollens.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      leaves.forEach((l) => {
        l.update();
        l.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="greenery-bg-container" aria-hidden="true">
      <canvas ref={canvasRef} className="greenery-canvas" />
      <div className="greenery-overlay" />
    </div>
  );
}
