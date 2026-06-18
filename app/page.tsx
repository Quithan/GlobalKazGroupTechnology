"use client";

import { motion, useInView, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Shield, Database, Video, Server,
  Globe, Users, TrendingUp, Award, Building2,
  Mail, Phone, MapPin, Menu, X,
  Zap, BarChart3, FileText, Headphones, Mic,
  ArrowRight, Check, Target, Settings,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceCard {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  tags: string[];
}

interface Agent {
  name: string;
  icon: React.ElementType;
  short: string;
  desc: string;
  results: string[];
}

interface Department {
  name: string;
  desc: string;
  icon: React.ElementType;
}

interface StatProps {
  value: number;
  suffix: string;
  label: string;
  icon: React.ElementType;
}

// ─── Particle Canvas ──────────────────────────────────────────────────────────
interface HeroParticle {
  x: number; y: number; originX: number; originY: number;
  vx: number; vy: number; size: number; color: string;
}
interface HeroBgParticle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; phase: number;
}

const P_DENSITY = 0.00015;
const BG_DENSITY = 0.00005;
const MOUSE_R = 180;
const RETURN_SPD = 0.08;
const DAMP = 0.90;
const REPULSION = 1.2;

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HeroParticle[]>([]);
  const bgRef = useRef<HeroBgParticle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, isActive: false });
  const frameRef = useRef<number>(0);

  const init = useCallback((w: number, h: number) => {
    const count = Math.floor(w * h * P_DENSITY);
    const ps: HeroParticle[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const r = Math.random();
      ps.push({
        x, y, originX: x, originY: y, vx: 0, vy: 0,
        size: Math.random() * 1.5 + 1,
        color: r > 0.88 ? '#2563eb' : r > 0.75 ? '#06b6d4' : '#ffffff',
      });
    }
    particlesRef.current = ps;

    const bgCount = Math.floor(w * h * BG_DENSITY);
    const bgs: HeroBgParticle[] = [];
    for (let i = 0; i < bgCount; i++) {
      bgs.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() + 0.5, alpha: Math.random() * 0.3 + 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }
    bgRef.current = bgs;
  }, []);

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pulsing radial glow
    const pulse = Math.sin(time * 0.0008) * 0.03 + 0.07;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(canvas.width, canvas.height) * 0.7);
    grad.addColorStop(0, `rgba(37,99,235,${pulse})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Background twinkle particles
    ctx.fillStyle = '#ffffff';
    for (const p of bgRef.current) {
      p.x = (p.x + p.vx + canvas.width) % canvas.width;
      p.y = (p.y + p.vy + canvas.height) % canvas.height;
      const twinkle = Math.sin(time * 0.002 + p.phase) * 0.5 + 0.5;
      ctx.globalAlpha = p.alpha * (0.3 + 0.7 * twinkle);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const ps = particlesRef.current;
    const mouse = mouseRef.current;

    // Mouse repulsion + spring return
    for (const p of ps) {
      const dx = mouse.x - p.x, dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (mouse.isActive && dist < MOUSE_R && dist > 0) {
        const force = ((MOUSE_R - dist) / MOUSE_R) * REPULSION;
        p.vx -= (dx / dist) * force * 5;
        p.vy -= (dy / dist) * force * 5;
      }
      p.vx += (p.originX - p.x) * RETURN_SPD;
      p.vy += (p.originY - p.y) * RETURN_SPD;
    }

    // Collision resolution
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i], b = ps[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const minD = a.size + b.size;
        if (distSq < minD * minD) {
          const d = Math.sqrt(distSq) || 0.01;
          const nx = dx / d, ny = dy / d;
          const overlap = (minD - d) * 0.5;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          const dot = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (dot > 0) {
            const imp = -(1.85 * dot) / (1 / a.size + 1 / b.size);
            a.vx += imp * nx / a.size; a.vy += imp * ny / a.size;
            b.vx -= imp * nx / b.size; b.vy -= imp * ny / b.size;
          }
        }
      }
    }

    // Draw
    for (const p of ps) {
      p.vx *= DAMP; p.vy *= DAMP;
      p.x += p.vx; p.y += p.vy;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const op = Math.min(0.3 + speed * 0.1, 1);
      if (p.color === '#2563eb') ctx.fillStyle = `rgba(37,99,235,${Math.min(op + 0.3, 1)})`;
      else if (p.color === '#06b6d4') ctx.fillStyle = `rgba(6,182,212,${Math.min(op + 0.3, 1)})`;
      else ctx.fillStyle = `rgba(255,255,255,${op})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const resize = () => {
      const el = containerRef.current, c = canvasRef.current;
      if (!el || !c) return;
      const { width, height } = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = width * dpr; c.height = height * dpr;
      c.style.width = `${width}px`; c.style.height = `${height}px`;
      const ctx = c.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      init(width, height);
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [init]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [animate]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden cursor-crosshair"
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, isActive: true };
      }}
      onMouseLeave={() => { mouseRef.current.isActive = false; }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

// ─── FadeIn wrapper ───────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({
  children,
  color = "blue",
}: {
  children: React.ReactNode;
  color?: "blue" | "cyan" | "gold";
}) {
  const styles = {
    blue: "border-[#2563eb]/30 bg-[#2563eb]/10 text-[#06b6d4]",
    cyan: "border-[#06b6d4]/30 bg-[#06b6d4]/10 text-[#06b6d4]",
    gold: "border-[#C9A961]/30 bg-[#C9A961]/10 text-[#C9A961]",
  };
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium mb-5 ${styles[color]}`}
    >
      {children}
    </div>
  );
}

// ─── Contact Modal ────────────────────────────────────────────────────────────
function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", phone: "", message: "" });
    setTimeout(() => { setSent(false); onClose(); }, 3000);
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-white/[0.10] bg-white/[0.06] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#2563eb]/60 focus:bg-white/[0.09] transition-all duration-200";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/72 backdrop-blur-md" onClick={onClose} />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative w-full max-w-lg bg-[#080f1c]/96 backdrop-blur-xl rounded-3xl border border-white/[0.12] shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Top shimmer line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2563eb]/60 to-transparent" />

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.10] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 cursor-pointer z-10"
            >
              <X size={15} />
            </button>

            <div className="p-8">
              <div className="mb-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-[#06b6d4] mb-2">
                  Связаться с нами
                </div>
                <h2 className="text-2xl font-bold text-white">Оставьте заявку</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Эксперт свяжется с вами в течение рабочего дня
                </p>
              </div>

              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-center py-10"
                  >
                    <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                      <Check size={24} className="text-green-400" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">Заявка отправлена!</h3>
                    <p className="text-gray-400 text-sm">Мы свяжемся с вами в ближайшее время.</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 text-xs mb-1.5">Имя *</label>
                        <input
                          type="text"
                          placeholder="Иван Иванов"
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          required
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-xs mb-1.5">Email</label>
                        <input
                          type="email"
                          placeholder="ivan@company.kz"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          required
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1.5">Телефон *</label>
                      <input
                        type="tel"
                        placeholder="+7 (___) ___-__-__"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-xs mb-1.5">Сообщение</label>
                      <textarea
                        rows={3}
                        placeholder="Опишите вашу задачу или вопрос..."
                        value={form.message}
                        onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 cursor-pointer"
                    >
                      Отправить заявку
                    </button>
                    <p className="text-gray-600 text-xs text-center">
                      Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ onContact }: { onContact: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#about", label: "О компании" },
    { href: "#services", label: "Услуги" },
    { href: "#projects", label: "Проекты" },
    { href: "#agents", label: "AI Агенты" },
    { href: "#contact", label: "Контакты" },
  ];

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#050d1a]/90 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/30"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-500/30 flex-shrink-0">
            GKG
          </div>
          <div className="leading-tight">
            <div className="text-white font-semibold text-sm">GlobalKazGroup</div>
            <div className="text-[#06b6d4] text-xs">Technology</div>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-gray-400 hover:text-white text-sm transition-colors duration-200 cursor-pointer"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <button
            onClick={onContact}
            className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer"
          >
            Связаться с нами
          </button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="md:hidden bg-[#050d1a]/95 backdrop-blur-xl border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-5 flex flex-col gap-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-gray-300 hover:text-white text-base py-1 transition-colors cursor-pointer"
                >
                  {l.label}
                </a>
              ))}
              <button
                onClick={() => { setOpen(false); onContact(); }}
                className="mt-2 px-5 py-3 bg-[#2563eb] text-white text-sm font-medium rounded-xl text-center cursor-pointer w-full"
              >
                Связаться
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <ParticleCanvas />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2563eb]/30 bg-[#2563eb]/10 text-[#06b6d4] text-sm font-medium mb-8"
          >
            <Zap size={14} />
            Системный IT/AI интегратор СНГ
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6"
          >
            Цифровая
            <br />
            <span className="text-gradient">трансформация</span>
            <br />
            через ИИ
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed"
          >
            GlobalKazGroup Technology — интегратор полного цикла. Внедряем AI-решения,
            ERP/CRM системы и цифровую инфраструктуру для B2G и B2B сегментов.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-wrap gap-4 mb-16"
          >
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 cursor-pointer"
            >
              Наши решения
              <ArrowRight size={18} />
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/15 hover:border-white/30 hover:bg-white/5 text-white font-semibold rounded-xl transition-all duration-200 cursor-pointer"
            >
              Связаться
            </a>
          </motion.div>

 
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
      >
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-gray-600" />
        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
      </motion.div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function AboutSection() {
  const advantages = [
    { icon: Award, text: "Доверенный игрок рынка" },
    { icon: Building2, text: "Опыт B2G и B2B сегментов" },
    { icon: Globe, text: "Компетенции уровня СНГ" },
    { icon: Check, text: "Полный цикл реализации" },
  ];

  return (
    <section id="about" className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1b2e]/40 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <FadeIn>
              <SectionLabel color="gold">О компании</SectionLabel>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
                Ведущий IT-интегратор{" "}
                <span className="text-[#06b6d4]">стран СНГ</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                ТОО «GlobalKazGroup Technology» — системный интегратор полного цикла,
                специализирующийся на внедрении решений в области искусственного
                интеллекта, цифровизации предприятий и автоматизации в секторах IT.
              </p>
            </FadeIn>
            <div className="grid sm:grid-cols-2 gap-3">
              {advantages.map((adv, i) => (
                <FadeIn key={adv.text} delay={0.1 * i + 0.3}>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-colors duration-200 cursor-default">
                    <div className="w-8 h-8 rounded-lg bg-[#2563eb]/20 flex items-center justify-center flex-shrink-0">
                      <adv.icon size={15} className="text-[#06b6d4]" />
                    </div>
                    <span className="text-gray-300 text-sm">{adv.text}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Right */}
          <FadeIn delay={0.3} className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#2563eb]/15 to-[#06b6d4]/8 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-7">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: "Клиентов", value: "13+" },
                    { label: "Проектов", value: "50+" },
                    { label: "Пользователей", value: "200К+" },
                    { label: "Лет опыта", value: "6+" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="p-5 rounded-2xl bg-[#0d1b2e]/70 border border-white/[0.08] text-center"
                    >
                      <div className="text-3xl font-bold text-gradient mb-1">{s.value}</div>
                      <div className="text-gray-500 text-xs">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="p-5 rounded-2xl bg-[#0d1b2e]/70 border border-white/[0.08]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-gray-400 text-xs font-medium">Ключевые партнёры</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["World Bank", "KazAtomProm", "KazMunayGas", "Baiterek", "Transtelecom"].map(
                      (c) => (
                        <span
                          key={c}
                          className="px-2.5 py-1 bg-white/[0.06] rounded-lg text-gray-400 text-xs border border-white/[0.08]"
                        >
                          {c}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ─── Services ─────────────────────────────────────────────────────────────────
const SERVICES: ServiceCard[] = [
  {
    icon: Zap,
    title: "AI Агенты",
    desc: "Автоматизация задач, ускорение работы команд и полный контроль над данными через искусственный интеллект.",
    color: "#2563eb",
    tags: ["B2G", "B2B", "Автоматизация"],
  },
  {
    icon: Shield,
    title: "Compliance Agent",
    desc: "Контроль соответствия документов международным стандартам ISO, ГОСТ, API, ASME с генерацией СОП.",
    color: "#06b6d4",
    tags: ["ISO", "ГОСТ", "Аудит"],
  },
  {
    icon: Mic,
    title: "VoiceNote Agent",
    desc: "Транскрибация аудио встреч с Teams, Zoom, Google Meet. Поддержка RU/KZ/UZ/EN языков.",
    color: "#8b5cf6",
    tags: ["Teams", "Zoom", "ИИ"],
  },
  {
    icon: Database,
    title: "Цифровой архив",
    desc: "Оцифровка бумажных носителей, безопасное хранение и умный поиск — переход к электронному документообороту.",
    color: "#C9A961",
    tags: ["OCR", "Хранение", "Поиск"],
  },
  {
    icon: Video,
    title: "Видеоаналитика",
    desc: "ИИ-видеонаблюдение 24/7: распознавание лиц, номеров ТС, контроль периметра и мониторинг событий.",
    color: "#10b981",
    tags: ["Безопасность", "ИИ", "24/7"],
  },
  {
    icon: Server,
    title: "Центры обработки данных",
    desc: "Строительство ЦОД под ключ. Сертификат TIER III Uptime Institute, 99.98% Uptime, более 800 стоек.",
    color: "#f59e0b",
    tags: ["TIER III", "99.98%", "Под ключ"],
  },
];

function ServicesSection() {
  return (
    <section id="services" className="py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <SectionLabel color="blue">Наши услуги</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Решения на базе{" "}
            <span className="text-gradient">искусственного интеллекта</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Переход от ручных процессов к передовым ИИ-технологиям для государственных и коммерческих организаций
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((svc, i) => (
            <FadeIn key={svc.title} delay={i * 0.07}>
              <div className="group relative p-6 rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.14] transition-all duration-300 hover:-translate-y-1.5 cursor-pointer h-full flex flex-col">
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-6 right-6 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, transparent, ${svc.color}, transparent)` }}
                />
                {/* Glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${svc.color}10, transparent 65%)`,
                  }}
                />
                <div className="relative flex flex-col flex-1">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 flex-shrink-0"
                    style={{ background: `${svc.color}18`, border: `1px solid ${svc.color}30` }}
                  >
                    <svc.icon size={22} style={{ color: svc.color }} />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-3">{svc.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">{svc.desc}</p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {svc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: `${svc.color}15`, color: svc.color }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatItem({ value, suffix, label, icon: Icon }: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const totalFrames = 70;
    const timer = setInterval(() => {
      frame++;
      setCount(Math.round((frame / totalFrames) * value));
      if (frame >= totalFrames) clearInterval(timer);
    }, 22);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center px-6 py-10">
      <div className="w-12 h-12 rounded-xl bg-[#2563eb]/15 border border-[#2563eb]/25 flex items-center justify-center mb-4">
        <Icon size={20} className="text-[#06b6d4]" />
      </div>
      <div className="text-4xl sm:text-5xl font-bold text-white mb-2 tabular-nums">
        {count}
        {suffix}
      </div>
      <div className="text-gray-500 text-sm max-w-[120px]">{label}</div>
    </div>
  );
}

const STATS: StatProps[] = [
  { value: 13, suffix: "+", label: "Крупных клиентов", icon: Users },
  { value: 50, suffix: "+", label: "Реализованных проектов", icon: Award },
  { value: 200, suffix: "К+", label: "Пользователей систем", icon: TrendingUp },
  { value: 9, suffix: "", label: "Построенных дата-центров", icon: Server },
];

function StatsSection() {
  return (
    <section className="py-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#2563eb]/5 via-transparent to-[#06b6d4]/5 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2563eb]/35 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2563eb]/35 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/[0.06]">
          {STATS.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────
const CLIENTS = [
  "World Bank", "KazAtomProm", "KazakhTelecom", "ЕНПФ",
  "KazMunayGas", "Baiterek", "KazTransOil", "Transtelecom",
  "Қазақстан Темір Жолы", "МИД РК", "Минюст РК", "Минобразования РК",
];

function ProjectsSection() {
  return (
    <section id="projects" className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1b2e]/30 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

        {/* Clients marquee */}
        <FadeIn>
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest text-center mb-8">
            Нам доверяют ведущие организации
          </p>
          <div className="relative overflow-hidden space-y-3">
            {/* Edge fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050d1a] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050d1a] to-transparent z-10 pointer-events-none" />

            {/* Row 1 — left to right */}
            <div className="flex gap-3 w-max marquee-fwd">
              {[...CLIENTS, ...CLIENTS].map((name, i) => (
                <div
                  key={i}
                  className="px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-gray-500 hover:text-white hover:border-[#2563eb]/40 hover:bg-[#2563eb]/8 transition-all duration-200 whitespace-nowrap text-sm font-medium cursor-default"
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Row 2 — right to left, reversed order */}
            <div className="flex gap-3 w-max marquee-rev">
              {[...[...CLIENTS].reverse(), ...[...CLIENTS].reverse()].map((name, i) => (
                <div
                  key={i}
                  className="px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-gray-500 hover:text-white hover:border-[#06b6d4]/40 hover:bg-[#06b6d4]/8 transition-all duration-200 whitespace-nowrap text-sm font-medium cursor-default"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── AI Agents ────────────────────────────────────────────────────────────────
const AGENTS: Agent[] = [
  {
    name: "Compliance Agent",
    icon: Shield,
    short: "Контроль стандартов",
    desc: "Автоматизирует контроль соответствия корпоративных документов международным и отраслевым нормам (ISO, ГОСТ, API, ASME) с генерацией стандартных операционных процедур.",
    results: ["Снижение рисков несоответствия на 70%", "Готовность к аудитам 24/7", "Автоматическая генерация СОП"],
  },
  {
    name: "VoiceNote Agent",
    icon: Mic,
    short: "Протоколы встреч",
    desc: "Первый AI-ассистент для рабочих встреч с полноценной поддержкой русского и других языков. Транскрибация аудио с Teams, Zoom, Google Meet.",
    results: ["Поддержка RU / KZ / UZ / EN", "Структурированные саммари встреч", "Хранение в едином пространстве"],
  },
  {
    name: "ServiceHub Agent",
    icon: Headphones,
    short: "Автоматизация поддержки",
    desc: "Агент для автоматизации поддержки и обработки запросов в службу поддержки. Чат-бот 24/7, triage тикетов, генерация ответов на частые обращения.",
    results: ["Работа 24/7 без перерывов", "Автоматический triage тикетов", "Снижение нагрузки на 60%"],
  },
  {
    name: "Signal Agent",
    icon: TrendingUp,
    short: "Мониторинг медиа",
    desc: "Интеллектуальная система мониторинга информационного поля в режиме 24/7. Поиск по ключевым словам, выявление деструктивного контента и угроз.",
    results: ["Мониторинг СМИ и соцсетей", "Выявление угроз безопасности", "Аналитика и отчёты"],
  },
  {
    name: "LegalHub Agent",
    icon: FileText,
    short: "Юридические решения",
    desc: "Агент для обработки жалоб и проверки документов в соответствии с нормативами, законами и технической спецификацией. Проверка договоров.",
    results: ["Проверка договоров", "Сверка с НПА и регламентами", "Подготовка проектов ответов"],
  },
  {
    name: "Report Generator",
    icon: BarChart3,
    short: "Автогенерация отчётов",
    desc: "Агент для генерации драфтовых и шаблонных PDF-отчётов на основе ваших данных. Интеграция с существующими системами учёта.",
    results: ["PDF-отчёты по шаблонам", "Интеграция с BI-системами", "Автоматическое расписание"],
  },
];

function AgentsSection() {
  const [active, setActive] = useState(0);

  return (
    <section id="agents" className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1b2e]/25 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <SectionLabel color="blue">AI Агенты</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Готовые{" "}
            <span className="text-gradient">ИИ-агенты</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Специализированные агенты для автоматизации бизнес-процессов. Без кода —
            каждый отдел может запустить самостоятельно или с нашей помощью.
          </p>
        </FadeIn>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* Agent list */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            {AGENTS.map((a, i) => (
              <button
                key={a.name}
                onClick={() => setActive(i)}
                className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer w-full ${
                  active === i
                    ? "border-[#2563eb]/50 bg-[#2563eb]/10"
                    : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    active === i ? "bg-[#2563eb]/25" : "bg-white/[0.06]"
                  }`}
                >
                  <a.icon
                    size={16}
                    className={active === i ? "text-[#06b6d4]" : "text-gray-500"}
                  />
                </div>
                <div className="min-w-0">
                  <div
                    className={`font-medium text-sm truncate ${
                      active === i ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {a.name}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5 truncate">{a.short}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
                className="p-8 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm h-full"
              >
                {(() => {
                  const Icon = AGENTS[active].icon;
                  return (
                    <div className="w-14 h-14 rounded-2xl bg-[#2563eb]/18 border border-[#2563eb]/28 flex items-center justify-center mb-6">
                      <Icon size={26} className="text-[#06b6d4]" />
                    </div>
                  );
                })()}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {AGENTS[active].name}
                </h3>
                <p className="text-gray-400 leading-relaxed mb-8">{AGENTS[active].desc}</p>
                <p className="text-white text-sm font-semibold mb-4">Ключевые результаты:</p>
                <div className="space-y-3 mb-8">
                  {AGENTS[active].results.map((r) => (
                    <div key={r} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#2563eb]/18 border border-[#2563eb]/35 flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-[#06b6d4]" />
                      </div>
                      <span className="text-gray-300 text-sm">{r}</span>
                    </div>
                  ))}
                </div>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  Запросить демо
                  <ArrowRight size={16} />
                </a>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Team ─────────────────────────────────────────────────────────────────────
const DEPARTMENTS: Department[] = [
  {
    name: "B2G/B2B Продажи",
    desc: "Развитие отношений с МИО, ЦГО и нац. компаниями; сопровождение сделок",
    icon: TrendingUp,
  },
  {
    name: "Presale",
    desc: "ТЗ, квалификационные требования, коммерческие предложения, работа с вендорами",
    icon: Target,
  },
  {
    name: "Отдел закупок",
    desc: "Участие в торгах на Goszakup, SK.kz, Tizilim, Omarket; конкурсные заявки",
    icon: FileText,
  },
  {
    name: "Аналитика",
    desc: "Анализ рыночных потребностей, мониторинг гос. программ, отраслевая экспертиза",
    icon: BarChart3,
  },
  {
    name: "Эксплуатация",
    desc: "Монтаж, пусконаладка, техобслуживание и постгарантийная поддержка решений",
    icon: Settings,
  },
  {
    name: "Юридический отдел",
    desc: "Юридическое сопровождение контрактов, договоров и проектной документации",
    icon: Shield,
  },
  {
    name: "Финансовый отдел",
    desc: "Бухгалтерский учёт, финансовая отчётность, бюджетирование и казначейство",
    icon: Award,
  },
];

function TeamSection() {
  return (
    <section id="team" className="py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <SectionLabel color="cyan">Наша команда</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Экспертная{" "}
            <span className="text-[#06b6d4]">команда профессионалов</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Каждое направление закрыто профильными специалистами с глубокими знаниями рынка СНГ
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DEPARTMENTS.map((d, i) => (
            <FadeIn key={d.name} delay={i * 0.07}>
              <div className="group p-6 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14] transition-all duration-300 cursor-default h-full">
                <div className="w-10 h-10 rounded-xl bg-[#2563eb]/15 border border-[#2563eb]/20 flex items-center justify-center mb-4 group-hover:bg-[#2563eb]/25 transition-colors duration-300">
                  <d.icon size={18} className="text-[#06b6d4]" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-2">{d.name}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{d.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setForm({ name: "", email: "", phone: "", message: "" });
    setTimeout(() => setSent(false), 5000);
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-white/[0.10] bg-white/[0.06] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#2563eb]/60 focus:bg-white/[0.09] transition-all duration-200";

  return (
    <section id="contact" className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1b2e]/35 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-16">
          <SectionLabel color="blue">Контакты</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Начните{" "}
            <span className="text-gradient">цифровую трансформацию</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Оставьте заявку — наш эксперт свяжется с вами в течение рабочего дня
          </p>
        </FadeIn>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Info */}
          <FadeIn delay={0.1} className="lg:col-span-2 space-y-4">
            {[
              { icon: MapPin, label: "Адрес", value: "г. Астана, Казахстан" },
              { icon: Mail, label: "Email", value: "info@GlobalKazGroupTechnology.kz" },
              { icon: Phone, label: "Телефон", value: "+7 (708) 603-23-71" },
            ].map((c) => (
              <div
                key={c.label}
                className="flex items-start gap-4 p-5 rounded-xl border border-white/[0.08] bg-white/[0.04]"
              >
                <div className="w-10 h-10 rounded-lg bg-[#2563eb]/15 border border-[#2563eb]/20 flex items-center justify-center flex-shrink-0">
                  <c.icon size={17} className="text-[#06b6d4]" />
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">{c.label}</div>
                  <div className="text-white text-sm font-medium">{c.value}</div>
                </div>
              </div>
            ))}
            <div className="p-5 rounded-xl border border-[#C9A961]/20 bg-[#C9A961]/5">
              <div className="text-[#C9A961] text-xs font-semibold mb-2">Для партнёров</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Приглашаем к долгосрочному партнёрству — прозрачная модель взаимодействия
                и доступ к крупным государственным и корпоративным проектам.
              </p>
            </div>
          </FadeIn>

          {/* Form */}
          <FadeIn delay={0.2} className="lg:col-span-3">
            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
              <AnimatePresence mode="wait">
                {sent ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-center py-14"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/35 flex items-center justify-center mx-auto mb-5">
                      <Check size={28} className="text-green-400" />
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">Заявка отправлена!</h3>
                    <p className="text-gray-400 text-sm">Мы свяжемся с вами в ближайшее время.</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="cf-name" className="block text-gray-400 text-xs mb-2">
                          Ваше имя *
                        </label>
                        <input
                          id="cf-name"
                          type="text"
                          placeholder="Иван Иванов"
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          required
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label htmlFor="cf-email" className="block text-gray-400 text-xs mb-2">
                          Email 
                        </label>
                        <input
                          id="cf-email"
                          type="email"
                          placeholder="ivan@company.kz"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          required
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="cf-phone" className="block text-gray-400 text-xs mb-2">
                        Телефон *
                      </label>
                      <input
                        id="cf-phone"
                        type="tel"
                        placeholder="+7 (___) ___-__-__"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="cf-message" className="block text-gray-400 text-xs mb-2">
                        Сообщение 
                      </label>
                      <textarea
                        id="cf-message"
                        rows={4}
                        placeholder="Опишите вашу задачу или вопрос..."
                        value={form.message}
                        onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                        required
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 cursor-pointer"
                    >
                      Отправить заявку
                    </button>
                    <p className="text-gray-600 text-xs text-center">
                      Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/[0.07] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#06b6d4] flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-500/25 flex-shrink-0">
                GKG
              </div>
              <div>
                <div className="text-white font-semibold text-sm">GlobalKazGroup Technology</div>
                <div className="text-gray-600 text-xs">ТОО «GlobalKazGroup Technology»</div>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Системный IT/AI интегратор полного цикла для B2G и B2B сегментов
              стран СНГ. Переход от ручных процессов к передовым ИИ-технологиям.
            </p>
          </div>

          {/* Services */}
          <div>
            <div className="text-white font-semibold text-sm mb-5">Услуги</div>
            <div className="space-y-3">
              {["AI Агенты", "Цифровой архив", "Видеоаналитика", "Центры данных", "ERP/CRM системы"].map(
                (s) => (
                  <a
                    key={s}
                    href="#services"
                    className="block text-gray-500 hover:text-gray-300 text-sm transition-colors cursor-pointer"
                  >
                    {s}
                  </a>
                )
              )}
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="text-white font-semibold text-sm mb-5">Компания</div>
            <div className="space-y-3">
              {[
                { label: "О компании", href: "#about" },
                { label: "Проекты", href: "#projects" },
                { label: "AI Агенты", href: "#agents" },
                { label: "Команда", href: "#team" },
                { label: "Контакты", href: "#contact" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="block text-gray-500 hover:text-gray-300 text-sm transition-colors cursor-pointer"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-gray-600 text-xs">
            © 2025 GlobalKazGroup Technology. Все права защищены.
          </div>
          <div className="flex gap-6">
            {["Политика конфиденциальности", "Условия использования"].map((s) => (
              <span
                key={s}
                className="text-gray-600 hover:text-gray-400 text-xs cursor-pointer transition-colors"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <Navbar onContact={() => setModalOpen(true)} />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <StatsSection />
      <ProjectsSection />
      <AgentsSection />
      <TeamSection />
      <ContactSection />
      <Footer />
    </div>
  );
}
