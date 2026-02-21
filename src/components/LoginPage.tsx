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
          stroke="hsl(195, 80%, 40%)"
          strokeOpacity={0.06}
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
          fill={glowingElectrodes.has(i) ? "hsl(30, 90%, 55%)" : "hsl(195, 80%, 40%)"}
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
            fill="hsl(30, 90%, 55%)"
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
        <ElectricPings />
      </div>

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-accent/10 rounded-full blur-[100px] animate-glow-pulse" style={{ animationDelay: "2s" }} />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-card/60 backdrop-blur-2xl border border-border/50 rounded-2xl p-8 shadow-2xl shadow-black/40">
          {/* Logo / Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
              <div className="w-5 h-5 rounded-md bg-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Välkommen tillbaka
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Logga in på ditt konto
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                E-post
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="namn@foretag.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted/50 border-border/50 h-11 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm text-muted-foreground">
                  Lösenord
                </Label>
                <button
                  type="button"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Glömt lösenord?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted/50 border-border/50 h-11 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold group"
              >
                Logga in
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card/60 px-3 text-muted-foreground">
                  eller
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4 h-11 bg-muted/30 border-border/50 text-foreground hover:bg-muted/50"
            >
              Fortsätt med Google
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            Har du inget konto?{" "}
            <button className="text-primary hover:text-primary/80 font-medium transition-colors">
              Skapa konto
            </button>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
