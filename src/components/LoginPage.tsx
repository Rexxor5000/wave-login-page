import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import loginBg from "@/assets/login-bg.png";

// Electrode points scattered across the viewport
const electrodes = [
  { x: 8, y: 15 },
  { x: 25, y: 8 },
  { x: 45, y: 20 },
  { x: 70, y: 10 },
  { x: 88, y: 18 },
  { x: 15, y: 45 },
  { x: 35, y: 55 },
  { x: 60, y: 42 },
  { x: 82, y: 50 },
  { x: 92, y: 35 },
  { x: 10, y: 75 },
  { x: 30, y: 82 },
  { x: 55, y: 70 },
  { x: 75, y: 80 },
  { x: 90, y: 72 },
  { x: 5, y: 92 },
  { x: 48, y: 90 },
  { x: 68, y: 60 },
  { x: 20, y: 30 },
  { x: 78, y: 28 },
];

// Pre-defined paths between electrodes (pairs of indices)
const paths = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8], [8, 9],
  [5, 10], [10, 11], [11, 12], [12, 13], [13, 14],
  [15, 10], [15, 16], [16, 12],
  [2, 7], [7, 12], [3, 9],
  [17, 8], [17, 13], [18, 5], [18, 1],
  [19, 4], [19, 9], [6, 11],
];

interface Ping {
  id: number;
  pathIndex: number;
  progress: number;
  speed: number;
  reverse: boolean;
}

const ElectricPings = () => {
  const [pings, setPings] = useState<Ping[]>([]);
  const [glowingElectrodes, setGlowingElectrodes] = useState<Set<number>>(new Set());
  const nextId = useRef(0);

  useEffect(() => {
    // Spawn new pings periodically
    const spawnInterval = setInterval(() => {
      const pathIndex = Math.floor(Math.random() * paths.length);
      const reverse = Math.random() > 0.5;
      const startElectrode = reverse ? paths[pathIndex][1] : paths[pathIndex][0];
      
      setPings((prev) => {
        if (prev.length > 5) return prev; // limit concurrent pings
        return [
          ...prev,
          {
            id: nextId.current++,
            pathIndex,
            progress: 0,
            speed: 0.003 + Math.random() * 0.004, // slow, organic speed
            reverse,
          },
        ];
      });
      
      // Glow the starting electrode
      setGlowingElectrodes((prev) => new Set(prev).add(startElectrode));
      setTimeout(() => {
        setGlowingElectrodes((prev) => {
          const next = new Set(prev);
          next.delete(startElectrode);
          return next;
        });
      }, 800);
    }, 1200);

    return () => clearInterval(spawnInterval);
  }, []);

  useEffect(() => {
    let animFrame: number;
    const animate = () => {
      setPings((prev) =>
        prev
          .map((p) => ({ ...p, progress: p.progress + p.speed }))
          .filter((p) => {
            if (p.progress >= 1) {
              // Glow the destination electrode
              const endElectrode = p.reverse
                ? paths[p.pathIndex][0]
                : paths[p.pathIndex][1];
              setGlowingElectrodes((prev) => new Set(prev).add(endElectrode));
              setTimeout(() => {
                setGlowingElectrodes((prev) => {
                  const next = new Set(prev);
                  next.delete(endElectrode);
                  return next;
                });
              }, 800);
              return false;
            }
            return true;
          })
      );
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <svg className="absolute inset-0 w-full h-full z-[1] pointer-events-none">
      <defs>
        <filter id="ping-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="electrode-glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Faint connection lines */}
      {paths.map(([a, b], i) => (
        <line
          key={`line-${i}`}
          x1={`${electrodes[a].x}%`}
          y1={`${electrodes[a].y}%`}
          x2={`${electrodes[b].x}%`}
          y2={`${electrodes[b].y}%`}
          stroke="hsl(260, 70%, 60%)"
          strokeOpacity={0.08}
          strokeWidth={0.5}
        />
      ))}

      {/* Electrode nodes */}
      {electrodes.map((e, i) => (
        <circle
          key={`node-${i}`}
          cx={`${e.x}%`}
          cy={`${e.y}%`}
          r={glowingElectrodes.has(i) ? 4 : 1.5}
          fill={glowingElectrodes.has(i) ? "hsl(270, 80%, 65%)" : "hsl(260, 50%, 55%)"}
          opacity={glowingElectrodes.has(i) ? 0.9 : 0.2}
          filter={glowingElectrodes.has(i) ? "url(#electrode-glow)" : undefined}
          style={{ transition: "all 0.6s ease-in-out" }}
        />
      ))}

      {/* Traveling pings */}
      {pings.map((p) => {
        const [a, b] = paths[p.pathIndex];
        const from = p.reverse ? electrodes[b] : electrodes[a];
        const to = p.reverse ? electrodes[a] : electrodes[b];
        const x = from.x + (to.x - from.x) * p.progress;
        const y = from.y + (to.y - from.y) * p.progress;
        const opacity = Math.sin(p.progress * Math.PI); // fade in/out
        return (
          <circle
            key={p.id}
            cx={`${x}%`}
            cy={`${y}%`}
            r={3}
            fill="hsl(270, 80%, 65%)"
            opacity={opacity * 0.8}
            filter="url(#ping-glow)"
          />
        );
      })}
    </svg>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <img
          src={loginBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover animate-wave"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(240,20%,96%)] via-[hsl(250,25%,95%)]/80 to-[hsl(260,30%,94%)]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(240,20%,96%)]/70 via-transparent to-[hsl(240,20%,96%)]/70" />
        <ElectricPings />
      </div>

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[hsl(270,70%,60%)]/10 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-[hsl(250,60%,55%)]/10 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: "2s" }} />

    </div>
  );
};

export default LoginPage;
