/**
 * CAS Cal - Epicycles PRO v2
 * 
 * Professional Fourier visualization with:
 * - Draw custom shapes → auto-calculate Fourier coefficients
 * - Line smoothing (Catmull-Rom spline interpolation)
 * - Preset templates (heart, star, infinity, signature)
 * - Function input f(t) → animate parametric curves
 * - Glow trail effects and smooth animations
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Play, Pause, RefreshCw, ZoomIn, ZoomOut,
    Pencil, Trash2, Move, MousePointer2, Sparkles,
    Heart, Star, Infinity, Sigma, Waves
} from 'lucide-react';

type WaveType = 'square' | 'triangle' | 'sawtooth' | 'custom';
type InputMode = 'drawing' | 'animation' | 'function';
type TemplateType = 'heart' | 'star' | 'infinity' | 'spiral' | 'lemniscate';

interface FourierCoeff {
    freq: number;
    amplitude: number;
    phase: number;
}

interface Point {
    x: number;
    y: number;
}

// Laplacian smoothing (Match Desktop Engine)
// P_new = 0.25*prev + 0.5*curr + 0.25*next
function laplacianSmooth(points: Point[], iterations: number = 3): Point[] {
    if (points.length < 3) return points;
    let currentPoints = [...points];

    for (let k = 0; k < iterations; k++) {
        const newPoints: Point[] = [currentPoints[0]]; // Keep start

        for (let i = 1; i < currentPoints.length - 1; i++) {
            const prev = currentPoints[i - 1];
            const curr = currentPoints[i];
            const next = currentPoints[i + 1];

            const x = 0.25 * prev.x + 0.5 * curr.x + 0.25 * next.x;
            const y = 0.25 * prev.y + 0.5 * curr.y + 0.25 * next.y;

            newPoints.push({ x, y });
        }

        newPoints.push(currentPoints[currentPoints.length - 1]); // Keep end
        currentPoints = newPoints;
    }
    return currentPoints;
}

// Template shape generators
const templateGenerators: Record<TemplateType, (scale: number) => Point[]> = {
    heart: (scale = 100) => {
        const points: Point[] = [];
        for (let t = 0; t <= 2 * Math.PI; t += 0.02) {
            const x = scale * 16 * Math.pow(Math.sin(t), 3) / 16;
            const y = -scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
            points.push({ x, y });
        }
        return points;
    },
    star: (scale = 100) => {
        const points: Point[] = [];
        for (let i = 0; i <= 10; i++) {
            const angle = (i * Math.PI / 5) - Math.PI / 2;
            const r = i % 2 === 0 ? scale : scale * 0.4;
            points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
        }
        return points;
    },
    infinity: (scale = 100) => {
        const points: Point[] = [];
        for (let t = 0; t <= 2 * Math.PI; t += 0.02) {
            const x = scale * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t));
            const y = scale * Math.sin(t) * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t));
            points.push({ x, y });
        }
        return points;
    },
    spiral: (scale = 80) => {
        const points: Point[] = [];
        for (let t = 0; t <= 6 * Math.PI; t += 0.05) {
            const r = scale * t / (6 * Math.PI);
            points.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
        }
        return points;
    },
    lemniscate: (scale = 100) => {
        const points: Point[] = [];
        for (let t = 0; t <= 2 * Math.PI; t += 0.02) {
            const cos = Math.cos(t);
            const sin = Math.sin(t);
            const denom = 1 + sin * sin;
            const x = scale * cos / denom;
            const y = scale * sin * cos / denom;
            points.push({ x, y });
        }
        return points;
    }
};

// Parse parametric function f(t)
function parseParametricFunction(funcStr: string, samples: number = 200): Point[] | null {
    try {
        // Clean the expression
        const cleaned = funcStr
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/pow/g, 'Math.pow')
            .replace(/PI/gi, 'Math.PI')
            .replace(/exp/g, 'Math.exp')
            .replace(/abs/g, 'Math.abs');

        const points: Point[] = [];

        // Parse as "x = expr; y = expr" or "r = expr" (polar)
        if (cleaned.includes(';')) {
            const [xExpr, yExpr] = cleaned.split(';').map(s => s.replace(/[xy]\s*=\s*/, '').trim());

            for (let i = 0; i <= samples; i++) {
                const t = (i / samples) * 2 * Math.PI;
                try {
                    const x = new Function('t', `return ${xExpr}`)(t) as number;
                    const y = new Function('t', `return ${yExpr}`)(t) as number;
                    if (isFinite(x) && isFinite(y)) {
                        points.push({ x: x * 100, y: y * 100 });
                    }
                } catch { continue; }
            }
        } else {
            // Assume polar: r = f(t)
            for (let i = 0; i <= samples; i++) {
                const t = (i / samples) * 4 * Math.PI;
                try {
                    const r = new Function('t', `return ${cleaned}`)(t) as number;
                    if (isFinite(r)) {
                        points.push({ x: r * 100 * Math.cos(t), y: r * 100 * Math.sin(t) });
                    }
                } catch { continue; }
            }
        }

        return points.length > 10 ? points : null;
    } catch {
        return null;
    }
}

// Discrete Fourier Transform
function computeDFT(points: Point[]): FourierCoeff[] {
    const N = points.length;
    if (N === 0) return [];

    const coefficients: FourierCoeff[] = [];

    for (let k = 0; k < N; k++) {
        let re = 0;
        let im = 0;

        for (let n = 0; n < N; n++) {
            const angle = (2 * Math.PI * k * n) / N;
            re += points[n].x * Math.cos(angle) + points[n].y * Math.sin(angle);
            im += points[n].y * Math.cos(angle) - points[n].x * Math.sin(angle);
        }

        re /= N;
        im /= N;

        const amplitude = Math.sqrt(re * re + im * im);
        const phase = Math.atan2(im, re);

        coefficients.push({ freq: k, amplitude, phase });
    }

    return coefficients
        .filter(c => c.amplitude > 0.1) // Filtering noise like Desktop
        .sort((a, b) => b.amplitude - a.amplitude);
}

const EpicyclesPRO: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Mode
    const [inputMode, setInputMode] = useState<InputMode>('animation');

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawnPoints, setDrawnPoints] = useState<Point[]>([]);
    const [fourierCoeffs, setFourierCoeffs] = useState<FourierCoeff[]>([]);

    // Function mode
    const [funcExpression, setFuncExpression] = useState('x = cos(t); y = sin(2*t)');
    const [funcError, setFuncError] = useState<string | null>(null);

    // Animation state
    const [isPlaying, setIsPlaying] = useState(true);
    const timeRef = useRef({ t: 0 });
    const pathRef = useRef<Point[]>([]);

    // Parameters
    const [numCircles, setNumCircles] = useState(50);
    const numCirclesRef = useRef(50);
    const [speed, setSpeed] = useState(1);
    const speedRef = useRef(1);
    const [waveType, setWaveType] = useState<WaveType>('custom');
    const waveTypeRef = useRef<WaveType>('custom');
    const [glowEnabled, setGlowEnabled] = useState(true);
    const [trailLength, setTrailLength] = useState(1500);

    // Viewport
    const zoomRef = useRef(1);
    const panRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const [, setTick] = useState(0);

    // Sync refs
    useEffect(() => { numCirclesRef.current = numCircles; }, [numCircles]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => {
        waveTypeRef.current = waveType;
        if (waveType !== 'custom') {
            setFourierCoeffs([]);
        }
    }, [waveType]);

    // Apply template
    const applyTemplate = (template: TemplateType) => {
        const points = templateGenerators[template](100);
        const smoothed = laplacianSmooth(points, 3);
        const coeffs = computeDFT(smoothed);
        setFourierCoeffs(coeffs);
        setWaveType('custom');
        setInputMode('animation');
        pathRef.current = [];
        timeRef.current.t = 0;
        setNumCircles(Math.min(100, coeffs.length));
    };

    // Apply function
    const applyFunction = () => {
        const points = parseParametricFunction(funcExpression);
        if (points) {
            const smoothed = laplacianSmooth(points, 3);
            const coeffs = computeDFT(smoothed);
            setFourierCoeffs(coeffs);
            setWaveType('custom');
            setInputMode('animation');
            pathRef.current = [];
            timeRef.current.t = 0;
            setNumCircles(Math.min(100, coeffs.length));
            setFuncError(null);
        } else {
            setFuncError('Error parsing function. Use format: x = cos(t); y = sin(t)');
        }
    };

    // Drawing handlers
    const handleDrawStart = useCallback((e: React.MouseEvent) => {
        if (inputMode !== 'drawing') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        setIsDrawing(true);
        setDrawnPoints([{
            x: e.clientX - rect.left - rect.width / 2,
            y: e.clientY - rect.top - rect.height / 2
        }]);
    }, [inputMode]);

    const handleDrawMove = useCallback((e: React.MouseEvent) => {
        if (!isDrawing || inputMode !== 'drawing') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        setDrawnPoints(prev => [...prev, {
            x: e.clientX - rect.left - rect.width / 2,
            y: e.clientY - rect.top - rect.height / 2
        }]);
    }, [isDrawing, inputMode]);

    const handleDrawEnd = useCallback(() => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (drawnPoints.length > 10) {
            // Apply Laplacian smoothing (Desktop Engine)
            const smoothed = laplacianSmooth(drawnPoints, 5);

            // Compute Fourier coefficients
            const coeffs = computeDFT(smoothed);
            setFourierCoeffs(coeffs);
            setWaveType('custom');
            setInputMode('animation');
            pathRef.current = [];
            timeRef.current.t = 0;
            setNumCircles(Math.min(100, coeffs.length));
        }
    }, [isDrawing, drawnPoints]);

    const clearDrawing = () => {
        setDrawnPoints([]);
        setFourierCoeffs([]);
        pathRef.current = [];
        timeRef.current.t = 0;
    };

    // Pan/Zoom handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (inputMode === 'drawing') return;
        zoomRef.current = Math.max(0.1, Math.min(10, zoomRef.current * (1 - e.deltaY * 0.001)));
        setTick(t => t + 1);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (inputMode === 'drawing') {
            handleDrawStart(e);
        } else {
            isDraggingRef.current = true;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (inputMode === 'drawing') {
            handleDrawMove(e);
        } else if (isDraggingRef.current) {
            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            panRef.current.x += dx;
            panRef.current.y += dy;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        if (inputMode === 'drawing') {
            handleDrawEnd();
        }
        isDraggingRef.current = false;
    };

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = container.clientWidth * dpr;
            canvas.height = container.clientHeight * dpr;
            canvas.style.width = container.clientWidth + 'px';
            canvas.style.height = container.clientHeight + 'px';
            ctx.scale(dpr, dpr);
        };
        window.addEventListener('resize', resize);
        resize();

        let animationFrameId: number;
        let lastTime = performance.now();

        const render = (now: number) => {
            const dt = (now - lastTime) * speedRef.current;
            lastTime = now;

            if (isPlaying && inputMode === 'animation') {
                timeRef.current.t += dt * 0.001;
            }

            draw(ctx, container.clientWidth, container.clientHeight, timeRef.current.t);
            animationFrameId = requestAnimationFrame(render);
        };
        render(lastTime);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isPlaying, inputMode, fourierCoeffs, waveType, glowEnabled, trailLength]);

    // Drawing function with glow effects
    const draw = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
        const zoom = zoomRef.current;
        const pan = panRef.current;

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
        ctx.scale(zoom, zoom);

        drawGrid(ctx, width, height, zoom);

        if (inputMode === 'drawing') {
            // Draw current path with smoothing preview
            if (drawnPoints.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = '#ff6b35';
                ctx.lineWidth = 3 / zoom;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.moveTo(drawnPoints[0].x, drawnPoints[0].y);
                for (const pt of drawnPoints) {
                    ctx.lineTo(pt.x, pt.y);
                }
                ctx.stroke();
            }
        } else {
            // Animation mode
            let x = 0, y = 0;

            if (waveType === 'custom' && fourierCoeffs.length > 0) {
                const maxCircles = Math.min(numCirclesRef.current, fourierCoeffs.length);

                for (let i = 0; i < maxCircles; i++) {
                    const coeff = fourierCoeffs[i];
                    const prevX = x, prevY = y;

                    const angle = coeff.freq * time * 2 * Math.PI + coeff.phase;
                    x += coeff.amplitude * Math.cos(angle);
                    y += coeff.amplitude * Math.sin(angle);

                    // Draw circle with glow
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + (1 - i / maxCircles) * 0.1})`;
                    ctx.lineWidth = 1 / zoom;
                    ctx.arc(prevX, prevY, coeff.amplitude, 0, Math.PI * 2);
                    ctx.stroke();

                    // Draw connecting line
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + (1 - i / maxCircles) * 0.3})`;
                    ctx.lineWidth = 1.5 / zoom;
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            } else {
                // Preset waves
                const baseAmplitude = 100;
                const maxCircles = numCirclesRef.current;

                for (let i = 0; i < maxCircles; i++) {
                    let n: number, radius: number;

                    switch (waveTypeRef.current) {
                        case 'square':
                            n = i * 2 + 1;
                            radius = baseAmplitude * (4 / (n * Math.PI));
                            break;
                        case 'triangle':
                            n = i * 2 + 1;
                            const sign = (i % 2 === 0) ? 1 : -1;
                            radius = baseAmplitude * sign * (8 / (Math.PI * Math.PI * n * n));
                            break;
                        case 'sawtooth':
                            n = i + 1;
                            radius = baseAmplitude * (2 / (n * Math.PI)) * (n % 2 === 0 ? -1 : 1);
                            break;
                        default:
                            n = i * 2 + 1;
                            radius = baseAmplitude * (4 / (n * Math.PI));
                    }

                    const prevX = x, prevY = y;
                    const angle = n * time;
                    x = prevX + radius * Math.cos(angle);
                    y = prevY + radius * Math.sin(angle);

                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                    ctx.lineWidth = 1 / zoom;
                    ctx.arc(prevX, prevY, Math.abs(radius), 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Store path point
            pathRef.current.push({ x, y });
            if (pathRef.current.length > trailLength) {
                pathRef.current.shift();
            }

            // Draw traced path with gradient
            if (pathRef.current.length > 1) {
                const gradient = ctx.createLinearGradient(
                    pathRef.current[0].x, pathRef.current[0].y,
                    pathRef.current[pathRef.current.length - 1].x,
                    pathRef.current[pathRef.current.length - 1].y
                );
                // Cleaner gradient (less blurry fade)
                gradient.addColorStop(0, 'rgba(255, 107, 53, 0)');
                gradient.addColorStop(0.2, 'rgba(255, 107, 53, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 107, 53, 1)');

                ctx.beginPath();
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2.5 / zoom;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                if (glowEnabled) {
                    // Subtle glow
                    ctx.shadowColor = '#ff6b35';
                    ctx.shadowBlur = 5 / zoom;
                }

                ctx.moveTo(pathRef.current[0].x, pathRef.current[0].y);
                for (const pt of pathRef.current) {
                    ctx.lineTo(pt.x, pt.y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Draw final point with glow
            if (glowEnabled) {
                ctx.shadowColor = '#ff6b35';
                ctx.shadowBlur = 15 / zoom;
            }
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.arc(x, y, 6 / zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, zoom: number) => {
        const step = 50;
        const left = -width / 2 / zoom;
        const right = width / 2 / zoom;
        const top = -height / 2 / zoom;
        const bottom = height / 2 / zoom;

        ctx.lineWidth = 1 / zoom;
        ctx.strokeStyle = '#1a1a1f';
        ctx.beginPath();

        for (let i = Math.floor(left / step) * step; i < right; i += step) {
            ctx.moveTo(i, top);
            ctx.lineTo(i, bottom);
        }
        for (let i = Math.floor(top / step) * step; i < bottom; i += step) {
            ctx.moveTo(left, i);
            ctx.lineTo(right, i);
        }
        ctx.stroke();

        ctx.lineWidth = 2 / zoom;
        ctx.strokeStyle = '#2a2a2f';
        ctx.beginPath();
        ctx.moveTo(left, 0); ctx.lineTo(right, 0);
        ctx.moveTo(0, top); ctx.lineTo(0, bottom);
        ctx.stroke();
    };

    return (
        <div className="flex flex-col lg:flex-row h-full bg-background text-white overflow-hidden font-black">
            {/* Sidebar */}
            <div className="w-full lg:w-80 bg-background border-r-2 border-white/10 flex flex-col z-20 shrink-0 shadow-xl overflow-y-auto">
                <div className="p-5 border-b-2 border-white/10 flex justify-between items-center bg-[#111111]">
                    <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={16} className="text-white" />
                        Epicycles PRO v2
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-2xl bg-black text-white border border-white/10 font-black">
                        {inputMode === 'drawing' ? 'DRAW' : inputMode === 'function' ? 'f(t)' : 'LIVE'}
                    </span>
                </div>

                <div className="p-5 space-y-6 flex-1">
                    {/* Mode Toggle */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-white uppercase">Modo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { mode: 'drawing' as InputMode, icon: Pencil, label: 'Dibujar' },
                                { mode: 'function' as InputMode, icon: Sigma, label: 'f(t)' },
                                { mode: 'animation' as InputMode, icon: Play, label: 'Animar' },
                            ].map(({ mode, icon: Icon, label }) => (
                                <button
                                    key={mode}
                                    onClick={() => setInputMode(mode)}
                                    className={`py-2 px-3 text-xs font-black rounded-2xl transition-all border border-white/10 flex flex-col items-center gap-1 ${inputMode === mode
                                        ? 'bg-primary text-white shadow-none translate-x-[2px] translate-y-[2px]'
                                        : 'bg-[#111111] text-white shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Drawing Mode */}
                    {inputMode === 'drawing' && (
                        <div className="p-4 rounded-2xl bg-primary/10 border border-white/10 shadow-xl">
                            <p className="text-sm text-white font-black">
                                ✏️ Dibuja una forma en el canvas. Al soltar se aplicará suavizado Laplaciano (Engine Desktop).
                            </p>
                            {drawnPoints.length > 0 && (
                                <button
                                    onClick={clearDrawing}
                                    className="mt-3 w-full py-2 text-sm bg-[#111111] text-red-600 border border-white/10 rounded-2xl shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl font-black flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} />
                                    Borrar
                                </button>
                            )}
                        </div>
                    )}

                    {/* Function Mode */}
                    {inputMode === 'function' && (
                        <div className="space-y-3">
                            <label className="text-xs font-black text-white uppercase">Función Paramétrica</label>
                            <textarea
                                value={funcExpression}
                                onChange={(e) => setFuncExpression(e.target.value)}
                                placeholder="x = cos(t); y = sin(2*t)"
                                className="w-full h-20 bg-[#111111] border border-white/10 rounded-2xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none placeholder:text-white/30"
                            />
                            {funcError && (
                                <p className="text-xs text-red-600 font-black">{funcError}</p>
                            )}
                            <button
                                onClick={applyFunction}
                                className="w-full py-2 bg-primary text-white font-black rounded-2xl border border-white/10 shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl"
                            >
                                Aplicar Función
                            </button>
                            <div className="text-xs text-white space-y-1">
                                <p className="font-black">Ejemplos:</p>
                                <button
                                    onClick={() => setFuncExpression('x = cos(t); y = sin(2*t)')}
                                    className="text-white underline block font-black"
                                >x = cos(t); y = sin(2*t)</button>
                                <button
                                    onClick={() => setFuncExpression('x = cos(t)*cos(3*t); y = sin(t)*cos(3*t)')}
                                    className="text-white underline block font-black"
                                >x = cos(t)*cos(3*t); y = sin(t)*cos(3*t)</button>
                                <button
                                    onClick={() => setFuncExpression('1 + 0.5*cos(5*t)')}
                                    className="text-white underline block font-black"
                                >r = 1 + 0.5*cos(5*t) (polar)</button>
                            </div>
                        </div>
                    )}

                    {/* Templates */}
                    {inputMode === 'animation' && (
                        <>
                            <div className="space-y-3">
                                <label className="text-xs font-black text-white uppercase">Plantillas</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { type: 'heart' as TemplateType, icon: Heart, label: 'Corazón' },
                                        { type: 'star' as TemplateType, icon: Star, label: 'Estrella' },
                                        { type: 'infinity' as TemplateType, icon: Infinity, label: 'Infinito' },
                                    ].map(({ type, icon: Icon, label }) => (
                                        <button
                                            key={type}
                                            onClick={() => applyTemplate(type)}
                                            className="py-2 px-3 text-xs font-black rounded-2xl transition-all border border-white/10 bg-[#111111] text-white shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl flex flex-col items-center gap-1"
                                        >
                                            <Icon size={16} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => applyTemplate('spiral')}
                                        className="py-2 px-3 text-xs font-black rounded-2xl transition-all border border-white/10 bg-[#111111] text-white shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl"
                                    >
                                        🌀 Espiral
                                    </button>
                                    <button
                                        onClick={() => applyTemplate('lemniscate')}
                                        className="py-2 px-3 text-xs font-black rounded-2xl transition-all border border-white/10 bg-[#111111] text-white shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl"
                                    >
                                        ∞ Lemniscata
                                    </button>
                                </div>
                            </div>

                            {/* Wave Presets */}
                            <div className="space-y-3">
                                <label className="text-xs font-black text-white uppercase">Ondas Preset</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['square', 'triangle', 'sawtooth'] as WaveType[]).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setWaveType(type);
                                                pathRef.current = [];
                                                timeRef.current.t = 0;
                                            }}
                                            className={`py-2 px-3 text-xs font-black rounded-2xl transition-all border border-white/10 ${waveType === type && fourierCoeffs.length === 0
                                                ? 'bg-primary text-white shadow-none translate-x-[2px] translate-y-[2px]'
                                                : 'bg-[#111111] text-white shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl'
                                                }`}
                                        >
                                            {type === 'square' && '▭ Cuadrada'}
                                            {type === 'triangle' && '△ Triángulo'}
                                            {type === 'sawtooth' && '⋸ Diente'}
                                        </button>
                                    ))}
                                    <button
                                        disabled={fourierCoeffs.length === 0}
                                        onClick={() => { setWaveType('custom'); pathRef.current = []; }}
                                        className={`py-2 px-3 text-xs font-black rounded-2xl transition-all border border-white/10 ${waveType === 'custom' && fourierCoeffs.length > 0
                                            ? 'bg-primary text-white shadow-none translate-x-[2px] translate-y-[2px]'
                                            : fourierCoeffs.length === 0
                                                ? 'bg-[#111111] text-white/30 border-white/10/20 cursor-not-allowed shadow-none'
                                                : 'bg-[#111111] text-white shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl'
                                            }`}
                                    >
                                        ✏️ Custom
                                    </button>
                                </div>
                            </div>

                            {/* Harmonics */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-black text-white uppercase">Armónicos</label>
                                    <input
                                        type="number"
                                        value={numCircles}
                                        onChange={(e) => { setNumCircles(parseInt(e.target.value) || 1); pathRef.current = []; }}
                                        className="w-16 bg-[#111111] border border-white/10 rounded-2xl px-2 py-1 text-xs text-white font-mono text-right focus:outline-none"
                                    />
                                </div>
                                <input
                                    type="range" min="1" max={waveType === 'custom' ? Math.max(fourierCoeffs.length, 100) : 100} step="1"
                                    value={numCircles}
                                    onChange={(e) => { setNumCircles(parseInt(e.target.value)); pathRef.current = []; }}
                                    className="w-full h-2 bg-[#111111] border border-white/10 rounded-2xl appearance-none cursor-pointer accent-black"
                                />
                            </div>

                            {/* Speed */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-black text-white uppercase">Velocidad</label>
                                    <span className="text-xs text-white font-mono font-black">{speed.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="5.0" step="0.1"
                                    value={speed}
                                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-[#111111] border border-white/10 rounded-2xl appearance-none cursor-pointer accent-black"
                                />
                            </div>

                            {/* Visual Options */}
                            <div className="space-y-3">
                                <label className="text-xs font-black text-white uppercase">Visual</label>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-xs text-white cursor-pointer font-black">
                                        <input
                                            type="checkbox"
                                            checked={glowEnabled}
                                            onChange={(e) => setGlowEnabled(e.target.checked)}
                                            className="accent-black w-4 h-4 border border-white/10 rounded-2xl"
                                        />
                                        Glow
                                    </label>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-white font-black">Trail</span>
                                    <span className="text-xs text-white font-mono font-black">{trailLength}</span>
                                </div>
                                <input
                                    type="range" min="100" max="3000" step="100"
                                    value={trailLength}
                                    onChange={(e) => setTrailLength(parseInt(e.target.value))}
                                    className="w-full h-2 bg-[#111111] border border-white/10 rounded-2xl appearance-none cursor-pointer accent-black"
                                />
                            </div>
                        </>
                    )}

                    {/* Fourier Info & Editor */}
                    {waveType === 'custom' && fourierCoeffs.length > 0 && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 shadow-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-2xl bg-emerald-500 border border-white/10"></div>
                                        <span className="text-xs font-black text-white">Fourier DFT</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const code = fourierCoeffs.map(c =>
                                                `${c.amplitude.toFixed(3)} * exp(${c.freq}j * t + ${c.phase.toFixed(3)}j)`
                                            ).join(' + ');
                                            const pyCode = `import numpy as np\n\ndef f(t):\n    # Generated by CAS Cal\n    return ${fourierCoeffs.slice(0, 20).map(c =>
                                                `(${c.amplitude.toFixed(4)}) * np.exp(1j * (${c.freq} * t + ${c.phase.toFixed(4)}))`
                                            ).join(' + \\\n           ')}`;

                                            navigator.clipboard.writeText(pyCode);
                                            alert("Código Python copiado al portapapeles! 🐍");
                                        }}
                                        className="text-[10px] px-2 py-1 bg-[#111111] hover:bg-black/5 rounded-2xl border border-white/10 shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl text-white font-black transition-all"
                                    >
                                        Export Python
                                    </button>
                                </div>
                                <div className="text-xs text-white font-mono mb-3 font-black">
                                    {fourierCoeffs.length} coeficientes • Top 5 Armónicos:
                                </div>

                                {/* Harmonic Editor (Top 5) */}
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                    {fourierCoeffs.slice(0, 5).map((coeff, idx) => (
                                        <div key={idx} className="bg-[#111111] p-2 rounded-2xl border border-white/10">
                                            <div className="flex justify-between text-[10px] text-white mb-1 font-black">
                                                <span>Freq: {coeff.freq}Hz</span>
                                                <span className="text-white">#{idx + 1}</span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-[10px] w-6 font-black">Amp</span>
                                                    <input
                                                        type="range" min="0" max="200" step="1"
                                                        value={coeff.amplitude}
                                                        onChange={(e) => {
                                                            const newCoeffs = [...fourierCoeffs];
                                                            newCoeffs[idx].amplitude = parseFloat(e.target.value);
                                                            setFourierCoeffs(newCoeffs);
                                                        }}
                                                        className="flex-1 h-2 bg-[#111111] border border-white/10 rounded-2xl appearance-none cursor-pointer accent-black"
                                                    />
                                                    <span className="text-[10px] w-8 text-right font-mono font-black">{coeff.amplitude.toFixed(0)}</span>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-[10px] w-6 font-black">Fase</span>
                                                    <input
                                                        type="range" min={-Math.PI} max={Math.PI} step="0.1"
                                                        value={coeff.phase}
                                                        onChange={(e) => {
                                                            const newCoeffs = [...fourierCoeffs];
                                                            newCoeffs[idx].phase = parseFloat(e.target.value);
                                                            setFourierCoeffs(newCoeffs);
                                                        }}
                                                        className="flex-1 h-2 bg-[#111111] border border-white/10 rounded-2xl appearance-none cursor-pointer accent-black"
                                                    />
                                                    <span className="text-[10px] w-8 text-right font-mono font-black">{coeff.phase.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reset */}
                    <button
                        onClick={() => { pathRef.current = []; timeRef.current.t = 0; setTick(t => t + 1); }}
                        className="w-full py-2 text-xs border border-white/10 rounded-2xl bg-[#111111] text-white shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl transition-all font-black"
                    >
                        <RefreshCw size={12} className="inline mr-2" />
                        Reiniciar
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div
                className="flex-1 relative h-full bg-[#0a0a0f] overflow-hidden select-none"
                ref={containerRef}
                style={{ cursor: inputMode === 'drawing' ? 'crosshair' : 'grab' }}
            >
                <canvas
                    ref={canvasRef}
                    className="block w-full h-full"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />

                {/* Floating Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-2xl bg-[#111111] border border-white/10 shadow-xl z-30">
                    <button
                        onClick={() => { zoomRef.current = Math.max(0.1, zoomRef.current - 0.2); setTick(t => t + 1); }}
                        className="p-3 rounded-2xl border border-white/10 bg-[#111111] text-white shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl transition-all"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <div className="w-0.5 h-10 bg-black"></div>
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="size-12 rounded-2xl bg-primary text-white border border-white/10 shadow-xl flex items-center justify-center hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>
                    <div className="w-0.5 h-10 bg-black"></div>
                    <button
                        onClick={() => { zoomRef.current = Math.min(10, zoomRef.current + 0.2); setTick(t => t + 1); }}
                        className="p-3 rounded-2xl border border-white/10 bg-[#111111] text-white shadow-xl hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-xl transition-all"
                    >
                        <ZoomIn size={20} />
                    </button>
                </div>

                {/* Mode Indicator */}
                <div className="absolute top-6 right-6 flex flex-col items-end pointer-events-none">
                    <h1 className="text-2xl font-black text-white/20 select-none">EPICYCLES PRO v2</h1>
                    <div className="flex items-center gap-4 text-white/30 font-mono text-xs mt-1">
                        {inputMode === 'drawing' ? (
                            <span className="flex items-center gap-1 font-black"><Pencil size={12} /> Catmull-Rom Smoothing</span>
                        ) : (
                            <>
                                <span className="flex items-center gap-1 font-black"><MousePointer2 size={12} /> Pan</span>
                                <span className="flex items-center gap-1 font-black"><Move size={12} /> Zoom</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

};

export default EpicyclesPRO;
