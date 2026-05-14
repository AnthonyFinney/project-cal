import React, { useState, useEffect, useRef } from 'react';
import { HistoryItem } from '../types';
import MathDisplay from './MathDisplay';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
// @ts-ignore
import nerdamer from 'nerdamer';
import ScientificKeypad from './ScientificKeypad';
import { Eraser, Cloud, CloudOff, AlertCircle, ToggleLeft, ToggleRight, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../services/apiService';
import { checkEasterEgg, parseNumberSystems, EasterEggResult } from '../services/easterEggs';
import { useCalculator, UserFunction } from '../CalculatorContext';
import { useNotifications } from '../contexts/NotificationContext';
import { MathService } from '../services/MathService';
import { parseExpression, ParseResult } from '../services/mathParser';
import { getAutocompleteSuggestions, FunctionDef } from '../services/functionDefs';
import { FINANCE_FUNCTIONS, FINANCE_FUNCTION_DEFS, FinanceResult } from '../services/financeFunctions';
import { ERRORES, SLASH_COMMANDS, LABELS } from '../locales/es-MX';
import { supabase } from '../contexts/AuthContext';
import AIResponseRenderer from './AIResponseRenderer';
const ConsoleMode: React.FC = () => {
  const { angleMode } = useCalculator();
  const { addNotification } = useNotifications();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarTab, setToolbarTab] = useState<'FUNC' | 'ABC' | 'GREEK' | 'CONST'>('FUNC');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use Global Calculator Context
  const { variables, setVariable, ans, setAns, isExact, toggleExact, defineFunction, getUserFunction, userFunctions } = useCalculator();

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<FunctionDef[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  // Substitute variables in expression
  const substituteVariables = (expr: string): string => {
    let result = expr;
    // Sort by length desc to avoid partial matches (e.g., 'ans' before 'an')
    const sortedVars = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);
    for (const [name, value] of sortedVars) {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      result = result.replace(regex, `(${value})`);
    }
    return result;
  };

  // Check if expression is an assignment (var = expr) or function definition (f(x) := expr)
  const parseAssignment = (expr: string): { isAssignment: boolean; isFunctionDef?: boolean; varName?: string; params?: string[]; valueExpr?: string } => {
    // Function definition: f(x) := expr or f(x, y) := expr
    const funcMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]+)\)\s*:=\s*(.+)$/);
    if (funcMatch) {
      const params = funcMatch[2].split(',').map(s => s.trim());
      return { isAssignment: true, isFunctionDef: true, varName: funcMatch[1].toLowerCase(), params, valueExpr: funcMatch[3] };
    }
    // Variable assignment: a = expr
    const match = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (match) {
      return { isAssignment: true, varName: match[1].toLowerCase(), valueExpr: match[2] };
    }
    return { isAssignment: false };
  };

  // Substitute user-defined functions in expression
  const substituteUserFunctions = (expr: string): string => {
    let result = expr;
    // Iterate over user functions and expand calls
    for (const [name, fnRaw] of Object.entries(userFunctions)) {
      const fn = fnRaw as UserFunction;
      // Match function calls like f(3) or g(x+1, 2)
      const regex = new RegExp(`\\b${name}\\s*\\(`, 'g');
      let match;
      while ((match = regex.exec(result)) !== null) {
        const startStr = match.index;
        const startArgs = startStr + match[0].length;
        let depth = 1;
        let i = startArgs;
        while (i < result.length && depth > 0) {
          if (result[i] === '(') depth++;
          if (result[i] === ')') depth--;
          i++;
        }
        if (depth === 0) {
          const argsStr = result.slice(startArgs, i - 1);
          const args = splitArgsSafe(argsStr);
          // Substitute params with args in the function body
          let expanded = fn.body;
          fn.params.forEach((param, idx) => {
            const argVal = args[idx] || '0';
            expanded = expanded.replace(new RegExp(`\\b${param}\\b`, 'g'), `(${argVal})`);
          });
          result = result.slice(0, startStr) + `(${expanded})` + result.slice(i);
          regex.lastIndex = startStr + expanded.length + 2;
        }
      }
    }
    return result;
  };

  const scrollToBottom = () => {
    // Dar tiempo a los useEffect de MathDisplay/KaTeX para que inyecten el DOM
    // antes de calcular la posición final de scroll
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  // Persistence: Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('cas_cal_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Basic validation: ensure it's an array
        if (Array.isArray(parsed)) {
          setHistory(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp) // Restore date objects
          })));
        }
      } catch (e) {
        console.error('Error loading history from localStorage:', e);
      }
    }
  }, []);

  // Persistence: Save to localStorage when history changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('cas_cal_history', JSON.stringify(history));
    }
    // Siempre hacer scroll al fondo cuando cambie el historial
    scrollToBottom();
  }, [history]);

  useEffect(() => {
    // Initialize Physics & Math Constants in the CAS engine
    try {
      nerdamer.setConstant('c', 299792458);         // Speed of Light
      nerdamer.setConstant('g', 9.80665);           // Standard Gravity
      nerdamer.setConstant('G', 6.67430e-11);       // Gravitational Constant
      nerdamer.setConstant('h', 6.62607015e-34);    // Planck Constant
      nerdamer.setConstant('k', 1.380649e-23);      // Boltzmann Constant
      nerdamer.setConstant('Na', 6.02214076e23);    // Avogadro Constant
      nerdamer.setConstant('R', 8.314462618);       // Gas Constant
      nerdamer.setConstant('me', 9.10938356e-31);   // Electron Mass
      nerdamer.setConstant('mp', 1.6726219e-27);    // Proton Mass
    } catch (e) {
      console.warn("Nerdamer constants initialization warning:", e);
    }
  }, []);

  // Clear parse error when input changes
  useEffect(() => {
    if (parseError) setParseError(null);
  }, [input]);

  // Check if expression is a finance function call
  const evaluateFinanceFunction = (expr: string): FinanceResult | null => {
    const trimmed = expr.trim().toLowerCase();

    // Match function pattern: funcName(args)
    const match = trimmed.match(/^(\w+)\s*\(([^)]*)\)$/);
    if (!match) return null;

    const [, funcName, argsStr] = match;

    if (!(funcName in FINANCE_FUNCTIONS)) return null;

    // Parse arguments (can be negative numbers, decimals)
    const args = argsStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => parseFloat(s));

    if (args.some(isNaN)) return null;

    try {
      const func = FINANCE_FUNCTIONS[funcName];
      return func(...args);
    } catch (e) {
      return null;
    }
  };

  // Helper: split arguments respecting nested parentheses
  const splitArgsSafe = (argsStr: string): string[] => {
    const args: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < argsStr.length; i++) {
      if (argsStr[i] === '(') depth++;
      if (argsStr[i] === ')') depth--;
      if (argsStr[i] === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += argsStr[i];
      }
    }
    if (current.trim()) args.push(current.trim());
    return args;
  };

  // Fallback: Client-side Nerdamer evaluation
  const evaluateWithNerdamer = (expr: string): string => {
    // First, check if it's a finance function
    const financeResult = evaluateFinanceFunction(expr);
    if (financeResult) {
      return financeResult.latex;
    }

    try {
      // Preprocess expression with our parser
      const parsed = parseExpression(expr);
      if (!parsed.success) {
        throw new Error(parsed.error || 'Parse error');
      }

      let processedExpr = parsed.expression;
      // Fix SymPy power syntax (**) to Nerdamer (^)
      processedExpr = processedExpr.replace(/\*\*/g, '^');
      processedExpr = processedExpr.replace(/\binf\b/g, 'Infinity');

      // Helper: auto-detect variable in expression (x, y, t, etc.)
      const detectVariable = (exprStr: string): string => {
        const vars = exprStr.match(/\b([a-z])\b/gi);
        if (vars) {
          if (vars.includes('x')) return 'x';
          if (vars.includes('y')) return 'y';
          if (vars.includes('t')) return 't';
          return vars[0];
        }
        return 'x';
      };

      // Helper: extract full function content with nested parens
      const extractAndTransform = (exprStr: string, funcNames: string[], transform: (args: string[]) => string): string => {
        let result = exprStr;
        for (const funcName of funcNames) {
          const regex = new RegExp(`\\b${funcName}\\s*\\(`, 'gi');
          let match;
          while ((match = regex.exec(result)) !== null) {
            const startStr = match.index;
            const startArgs = startStr + match[0].length;
            let depth = 1;
            let i = startArgs;
            while (i < result.length && depth > 0) {
              if (result[i] === '(') depth++;
              if (result[i] === ')') depth--;
              i++;
            }
            if (depth === 0) {
              const inner = result.slice(startArgs, i - 1);
              const args = splitArgsSafe(inner);
              const replaced = transform(args);
              result = result.slice(0, startStr) + `${funcName}(${replaced})` + result.slice(i);
              regex.lastIndex = startStr + funcName.length + replaced.length + 2;
            }
          }
        }
        return result;
      };

      // Fix integrate()
      processedExpr = extractAndTransform(processedExpr, ['integrate'], (args) => {
        if (args.length === 1) return `${args[0]}, ${detectVariable(args[0])}`;
        if (args.length === 2) return `${args[0]}, ${args[1]}`;
        if (args.length === 3) return `defint(${args[0]}, ${args[1]}, ${args[2]}, x)`;
        if (args.length === 4) return `${args[0]}, ${args[2]}, ${args[3]}, ${args[1]}`;
        return args.join(', ');
      });

      // Fix diff() / derivative()
      processedExpr = extractAndTransform(processedExpr, ['diff', 'derivative'], (args) => {
        if (args.length === 1) return `${args[0]}, ${detectVariable(args[0])}`;
        if (args.length === 2) return `${args[0]}, ${args[1]}`;
        if (args.length === 3) return `${args[0]}, ${args[1]}, ${args[2]}`;
        return args.join(', ');
      });

      // Fix d/dx notation → diff(expr, x)
      processedExpr = extractAndTransform(processedExpr, ['d/d[a-z]'], (args) => {
        return args.join(', ');
      });

      // Fix factorial(n) → (n)! for Nerdamer
      processedExpr = processedExpr.replace(/\bfactorial\s*\(([^()]+|\([^()]*\))+\)/gi, (match) => {
        const start = match.indexOf('(') + 1;
        let depth = 1;
        let i = start;
        while (i < match.length && depth > 0) {
          if (match[i] === '(') depth++;
          if (match[i] === ')') depth--;
          i++;
        }
        const inner = match.slice(start, i - 1);
        return `(${inner})!`;
      });

      const resultObj = nerdamer(processedExpr);
      const symbolicLatex = resultObj.toTeX();
      return symbolicLatex;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Syntax error';
      return `\\text{${errorMsg.replace(/_/g, '\\_')}}`;
    }
  };
  // Helper: Extract content inside function call (handles nested parens)
  const extractFunctionContent = (expr: string, funcName: string): string => {
    const start = funcName.length + 1; // after "funcName("
    let depth = 1;
    let i = start;
    while (i < expr.length && depth > 0) {
      if (expr[i] === '(') depth++;
      if (expr[i] === ')') depth--;
      i++;
    }
    return expr.slice(start, i - 1);
  };

  // Primary: Backend API evaluation (SymPy)
  const evaluateWithBackend = async (expr: string): Promise<string> => {
    try {
      // Preprocess expression with our parser first
      const parsed = parseExpression(expr);
      if (!parsed.success) {
        setParseError(parsed.error || 'Parse error');
        return `\\text{${parsed.error?.replace(/_/g, '\\_') || 'Error'}}`;
      }
      const processedExpr = parsed.expression;

      // Detect operation type from expression
      if (processedExpr.startsWith('simplify(')) {
        const inner = extractFunctionContent(processedExpr, 'simplify');
        const res = await apiService.simplify(inner);
        return res.latex || res.result;
      } else if (processedExpr.startsWith('expand(')) {
        const inner = extractFunctionContent(processedExpr, 'expand');
        const res = await apiService.expand(inner);
        return res.result;
      } else if (processedExpr.startsWith('factor(')) {
        const inner = extractFunctionContent(processedExpr, 'factor');
        const res = await apiService.factor(inner);
        return res.result;
      } else if (processedExpr.startsWith('diff(') || processedExpr.startsWith('derivative(')) {
        const funcName = processedExpr.startsWith('diff(') ? 'diff' : 'derivative';
        const inner = extractFunctionContent(processedExpr, funcName);
        const parts = splitArgsSafe(inner);
        if (parts.length >= 2) {
          const res = await apiService.derivative(parts[0], parts[1]);
          return res.latex || res.result;
        } else if (parts.length === 1) {
          const res = await apiService.derivative(parts[0], 'x');
          return res.latex || res.result;
        }
      } else if (processedExpr.startsWith('integrate(')) {
        const inner = extractFunctionContent(processedExpr, 'integrate');
        const parts = splitArgsSafe(inner);
        if (parts.length >= 4) {
          const res = await apiService.integral(parts[0], parts[1], parseFloat(parts[2]), parseFloat(parts[3]));
          return res.latex || res.result;
        } else if (parts.length === 3) {
          const res = await apiService.integral(parts[0], 'x', parseFloat(parts[1]), parseFloat(parts[2]));
          return res.latex || res.result;
        } else if (parts.length >= 2) {
          const res = await apiService.integral(parts[0], parts[1]);
          return res.latex || res.result;
        } else if (parts.length === 1) {
          const res = await apiService.integral(parts[0], 'x');
          return res.latex || res.result;
        }
      } else if (processedExpr.startsWith('solve(')) {
        const inner = extractFunctionContent(processedExpr, 'solve');
        const parts = inner.split(',').map(s => s.trim());
        const res = await apiService.solve(parts[0], parts[1] || 'x');
        return res.result;
      } else if (processedExpr.startsWith('limit(')) {
        const inner = extractFunctionContent(processedExpr, 'limit');
        const parts = splitArgsSafe(inner);
        if (parts.length === 2) {
          const res = await apiService.limit(parts[0], 'x', parts[1]);
          return res.latex || res.result;
        }
        const res = await apiService.limit(parts[0], parts[1] || 'x', parts[2] || '0');
        return res.latex || res.result;
      } else if (processedExpr.startsWith('taylor(')) {
        const inner = extractFunctionContent(processedExpr, 'taylor');
        const parts = splitArgsSafe(inner);
        const res = await apiService.taylor(parts[0], parts[1] || 'x', parts[2] || '0', parseInt(parts[3]) || 5);
        return res.latex || res.result;
      } else if (processedExpr.startsWith('laplace(')) {
        const inner = extractFunctionContent(processedExpr, 'laplace');
        const res = await apiService.laplace(inner);
        return res.latex || res.result;
      } else if (processedExpr.startsWith('fourier(')) {
        const inner = extractFunctionContent(processedExpr, 'fourier');
        const res = await apiService.fourier(inner);
        return res.latex || res.result;
      } else if (processedExpr.startsWith('ilaplace(') || processedExpr.startsWith('inverse_laplace(')) {
        const funcName = processedExpr.startsWith('ilaplace(') ? 'ilaplace' : 'inverse_laplace';
        const inner = extractFunctionContent(processedExpr, funcName);
        const res = await apiService.ilaplace(inner);
        return res.latex || res.result;
      } else if (processedExpr.startsWith('ifourier(') || processedExpr.startsWith('inverse_fourier(')) {
        const funcName = processedExpr.startsWith('ifourier(') ? 'ifourier' : 'inverse_fourier';
        const inner = extractFunctionContent(processedExpr, funcName);
        const res = await apiService.ifourier(inner);
        return res.latex || res.result;
      } else if (processedExpr.startsWith('explain(') || processedExpr.startsWith('explicar(')) {
        // AI Explain Mode
        const funcName = processedExpr.startsWith('explain') ? 'explain' : 'explicar';
        const inner = extractFunctionContent(processedExpr, funcName);
        try {
          // Use the existing apiService if we add explain method, or fetch directly
          // Assuming apiService doesn't have explain yet, we'll fetch direct for now
          const response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'}/api/ai/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: inner })
          });
          const data = await response.json();
          // Format explanation as text
          return {
            latex: `\\text{AI Analysis}`,
            rawValue: data.explanation || 'No explanation',
            approxResult: 'AI',
            easterEgg: { triggered: true, message: data.explanation, emoji: '🤖', animation: 'glow' }
          } as any;
        } catch (e) {
          return `\\text{AI Service Unavailable}`;
        }
      }
      // Default: evaluate universal (SymPy with full namespace)
      const res = await apiService.evaluate(processedExpr);
      return res.latex || res.result;
    } catch (error) {
      console.warn('Backend failed, falling back to Nerdamer:', error);
      setUseBackend(false);
      return evaluateWithNerdamer(expr);
    }
  };

  // Main evaluation function with preprocessing
  const evaluateExpression = async (expr: string): Promise<{ latex: string; rawValue: string; approxResult: string; easterEgg?: EasterEggResult; plotData?: {x: number, y: number}[] }> => {
    setParseError(null);  // Clear previous errors

    // 1. Special Commands Check (PRIORITY)

    const trimmedExpr = expr.trim();

    // Audio Generation: sonify(...) or sonificar(...)
    // Regex allows optional spaces and case insensitivity: sonify ( ... )
    const sonifyMatch = trimmedExpr.match(/^(sonify|sonificar)\s*\((.+)\)$/i);
    if (sonifyMatch) {
      let inner = sonifyMatch[2];

      // Auto-fix: Translate 'sen' -> 'sin'
      const { translateToEnglish } = await import('../services/functionDefs');
      inner = translateToEnglish(inner);

      // Auto-fix: Replace 'x' with 't' for audio generation implication
      inner = inner.replace(/\bx\b/g, 't');

      try {
        await MathService.sonify(inner);
        addNotification('Audio Generated', `Playing sound for: ${inner}`, '🎵');
        return { latex: '\\text{🎵 Audio Playing...}', rawValue: 'Audio', approxResult: 'Audio' };
      } catch (e) {
        console.error("Sonify Error:", e);
        return { latex: '\\text{Error de Audio. Verifique su expresion.}', rawValue: 'Error', approxResult: 'Error' };
      }
    }

    // Graph Generation: plot(...) or graficar(...)
    const plotMatch = trimmedExpr.match(/^(plot|graficar)\s*\((.+)\)$/i);
    if (plotMatch) {
      const inner = plotMatch[2];
      try {
        const res = await apiService.plot(inner, 'x', -10, 10, 200);
        return {
          latex: `\\text{Gráfica de } ${inner}`,
          rawValue: `plot(${inner})`,
          approxResult: '',
          plotData: res.points
        };
      } catch (e) {
        return { latex: `\\text{Error al graficar } ${inner}`, rawValue: 'Error', approxResult: 'Error' };
      }
    }

    const plotsonifyMatch = trimmedExpr.match(/^(plotsonify|graficar_y_sonar|sonificar)\s*\((.+)\)$/i);
    if (plotsonifyMatch) {
      const inner = plotsonifyMatch[2];
      try {
        const res = await apiService.plot(inner, 'x', -10, 10, 200);
        
        // Sonify simultaneously
        let innerForSonify = inner;
        const { translateToEnglish } = await import('../services/functionDefs');
        innerForSonify = translateToEnglish(innerForSonify).replace(/\bx\b/g, 't');
        MathService.sonify(innerForSonify).catch(e => console.error(e));

        return {
          latex: `\\text{Gráfica \& Sonido de } ${inner}`,
          rawValue: `plotsonify(${inner})`,
          approxResult: '',
          plotData: res.points,
          easterEgg: { triggered: true, message: 'Audio Generated', emoji: '🎵', animation: 'glow' }
        };
      } catch (e) {
        return { latex: `\\text{Error al graficar } ${inner}`, rawValue: 'Error', approxResult: 'Error' };
        }
    }

    // Advanced CAS Commands: laplace, fourier, ilaplace, ifourier, taylor
    // Intercepted BEFORE parser to avoid implicit multiplication breaking names
    const advancedMatch = trimmedExpr.match(/^(laplace|fourier|ilaplace|ifourier|inverse_laplace|inverse_fourier|taylor)\s*\((.+)\)$/i);
    if (advancedMatch) {
      const funcName = advancedMatch[1].toLowerCase();
      const innerRaw = advancedMatch[2];
      // Translate inner expression (e.g., sen→sin) but preserve the outer function
      const { translateToEnglish } = await import('../services/functionDefs');
      const inner = translateToEnglish(innerRaw);

      try {
        let res;
        if (funcName === 'taylor') {
          const parts = inner.split(',').map(s => s.trim());
          res = await apiService.taylor(parts[0], parts[1] || 'x', parts[2] || '0', parseInt(parts[3]) || 5);
        } else if (funcName === 'laplace') {
          res = await apiService.laplace(inner);
        } else if (funcName === 'fourier') {
          res = await apiService.fourier(inner);
        } else if (funcName === 'ilaplace' || funcName === 'inverse_laplace') {
          res = await apiService.ilaplace(inner);
        } else if (funcName === 'ifourier' || funcName === 'inverse_fourier') {
          res = await apiService.ifourier(inner);
        } else {
          res = await apiService.simplify(trimmedExpr);
        }
        const result = res.latex || res.result;
        return { latex: result, rawValue: res.result, approxResult: res.result };
      } catch (e) {
        return { latex: `\\text{Error en ${funcName}}`, rawValue: 'Error', approxResult: 'Error' };
      }
    }

    // AI Explanation: explain(...), explicar(...), ai ...
    const explainMatch = trimmedExpr.match(/^(explain|explicar)\s*\((.+)\)$/i);
    const aiPrefixMatch = trimmedExpr.match(/^ai\s+(.+)$/i);

    if (explainMatch || aiPrefixMatch) {
      let inner = "";
      if (aiPrefixMatch) {
        inner = aiPrefixMatch[1]; // "solve contrast"
      } else if (explainMatch) {
        inner = explainMatch[2]; // "terms"
        // Remove quotes if present around the topic
        inner = inner.replace(/^["'](.+)["']$/, '$1');
      }

      try {
        // Fetch from Backend AI Service (with auth token)
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'}/api/ai/explain`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ query: inner })
        });
        const data = await response.json();

        return {
          latex: `\\text{AI Analysis}`,
          rawValue: data.explanation || 'No explanation',
          approxResult: 'AI',
          easterEgg: { triggered: true, message: data.explanation, emoji: '🤖', animation: 'glow' }
        } as any;
      } catch (e) {
        return { latex: `\\text{AI Service Unavailable}`, rawValue: 'Error', approxResult: 'Error' };
      }
    }

    // 2. Normal Math Parsing
    // Parse binary/hex/octal literals (0b1010 → 10, 0xFF → 255)
    let processedExpr = parseNumberSystems(expr);

    // Substitute user-defined functions FIRST (before variables)
    processedExpr = substituteUserFunctions(processedExpr);

    // Substitute user variables (including ans)
    const substitutedExpr = substituteVariables(processedExpr);

    let latex: string;
    let rawValue: string;
    let approxResult: string = '';

    if (useBackend && apiService.isAvailable) {
      latex = await evaluateWithBackend(substitutedExpr);
    } else {
      latex = evaluateWithNerdamer(substitutedExpr);
    }

    // Try to get a clean numeric/symbolic value for ANS
    // Remove LaTeX formatting for storage
    rawValue = latex
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')  // \frac{a}{b} → (a)/(b)
      .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')              // \sqrt{x} → sqrt(x)
      .replace(/\\left|\\right/g, '')                         // Remove \left \right
      .replace(/\\[a-zA-Z]+/g, '')                             // Remove other LaTeX commands
      .replace(/[{}]/g, '')                                     // Remove braces
      .trim();

    // If it looks like a simple number, use that
    const numMatch = latex.match(/^-?\d+\.?\d*$/);
    if (numMatch) rawValue = numMatch[0];

    // Try to compute numeric APROXimation
    try {
      const parsed = parseExpression(substitutedExpr);
      if (parsed.success) {
        const numericResult = nerdamer(parsed.expression).evaluate();
        approxResult = parseFloat(numericResult.text()).toPrecision(10);
        // Clean up trailing zeros
        approxResult = parseFloat(approxResult).toString();
      }
    } catch (e) {
      // If symbolic approximation fails, set it to rawValue instead of blindly extracting numbers
      approxResult = rawValue;
    }

    // Check for easter eggs
    const easterEgg = checkEasterEgg(expr, approxResult || rawValue);

    return { latex, rawValue: rawValue || '0', approxResult: approxResult || rawValue || '0', easterEgg: easterEgg.triggered ? easterEgg : undefined };
  };

  const handleKeyClick = async (val: string) => {
    if (val === 'AC') {
      setInput('');
    } else if (val === 'DEL') {
      setInput(input.slice(0, -1));
    } else if (val === '=') {
      if (!input.trim() || isLoading) return;

      const trimmedInput = input.trim().toLowerCase();
      if (trimmedInput === 'clear' || trimmedInput === 'cls' || trimmedInput === '/clear') {
        setHistory([]);
        setInput('');
        return;
      }

      setIsLoading(true);
      try {
        // Split by semicolons or newlines for batch evaluation
        const expressions = input.split(/[;\n]/).map(s => s.trim()).filter(s => s.length > 0);
        const newItems: HistoryItem[] = [];

        for (const singleExpr of expressions) {
          const assignment = parseAssignment(singleExpr);
          let displayExpr = singleExpr;
          let resultLatex: string;
          let rawValue: string;
          let approxResult: string;
          let easterEggResult: EasterEggResult | undefined;
          let plotData: {x: number, y: number}[] | undefined;

          if (assignment.isAssignment && assignment.varName && assignment.valueExpr) {
            if (assignment.isFunctionDef && assignment.params) {
              defineFunction(assignment.varName, assignment.params, assignment.valueExpr);
              resultLatex = `\\text{${assignment.varName}(${assignment.params.join(', ')}) definida}`;
              rawValue = assignment.valueExpr;
              approxResult = '';
              displayExpr = `${assignment.varName}(${assignment.params.join(', ')}) := ${assignment.valueExpr}`;
            } else {
              const evalResult = await evaluateExpression(assignment.valueExpr);
              resultLatex = evalResult.latex;
              rawValue = evalResult.rawValue;
              approxResult = evalResult.approxResult;
              easterEggResult = evalResult.easterEgg;
              plotData = evalResult.plotData;
              displayExpr = `${assignment.varName} = ${assignment.valueExpr}`;
              setVariable(assignment.varName!, rawValue);
            }
            setAns(rawValue);
          } else {
            const evalResult = await evaluateExpression(singleExpr);
            resultLatex = evalResult.latex;
            rawValue = evalResult.rawValue;
            approxResult = evalResult.approxResult;
            easterEggResult = evalResult.easterEgg;
            plotData = evalResult.plotData;
            setAns(rawValue);
          }

          newItems.push({
            id: Date.now().toString() + '_' + newItems.length,
            expression: displayExpr,
            result: resultLatex,
            approxResult: approxResult,
            timestamp: new Date(),
            easterEgg: easterEggResult,
            plotData: plotData
          });
        }

        setHistory(prev => [...prev, ...newItems]);
        setInput('');
      } finally {
        setIsLoading(false);
      }
    } else {
      let append = val;
      if (['sin', 'cos', 'tan', 'ln', 'log', 'sqrt'].includes(val)) {
        append = val + '(';
      }
      setInput(input + append);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#111111] text-white overflow-hidden relative">
      {/* Main: Console Output & Input Area */}
      <div className="flex-1 grid grid-rows-[1fr_auto] h-full w-full min-w-0 overflow-hidden relative z-10">

        {/* History Log */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          <div className="flex justify-between items-end mb-4 border-b-4 border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles size={12} className="text-white" />
                Historial de Cálculos
              </h2>
              {useBackend ? (
                <div title="Backend SymPy conectado">
                  <Cloud size={14} className="text-white" />
                </div>
              ) : (
                <div title="Modo local (Nerdamer)">
                  <CloudOff size={14} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* EXACTO/APROX Toggle */}
              <button
                onClick={toggleExact}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-black tracking-wider uppercase transition-all border border-white/10 shadow-xl ${isExact
                  ? 'bg-white/10 text-white'
                  : 'bg-[#111111] text-white'
                  }`}
                title={isExact ? 'Mostrando resultado exacto' : 'Mostrando aproximación'}
              >
                {isExact ? (
                  <><ToggleLeft size={16} /> Exacto</>
                ) : (
                  <><ToggleRight size={16} /> ≈ Aprox</>
                )}
              </button>

              <div className="w-1 h-6 bg-black mx-1"></div>

              <button onClick={() => setHistory([])} className="text-white hover:bg-white/5 transition-all p-2 border border-white/10 rounded-2xl shadow-xl bg-[#111111]" title="Limpiar historial">
                <Eraser size={16} />
              </button>
            </div>
          </div>

          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-white mt-20">
              <span className="text-8xl mb-4 font-black">∫</span>
              <p className="text-sm font-black tracking-widest uppercase">Start calculating...</p>
            </div>
          )}

          <AnimatePresence>
            {history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className="group flex flex-col gap-4 p-6 rounded-2xl bg-[#111111] border border-white/10 shadow-xl transition-all"
              >
                <div className="text-right text-white text-xl font-mono tracking-wide">
                <MathDisplay expression={item.expression} />
              </div>

              {/* Easter Egg / AI Response Display */}
              {item.easterEgg && item.easterEgg.message && (
                <div className={`
                  my-2 p-4 rounded-2xl border border-white/10 text-sm text-white
                  ${item.easterEgg.animation === 'rainbow' ? 'bg-white/5' : ''}
                  ${item.easterEgg.animation === 'glow' ? 'bg-white/10' : ''}
                  ${item.easterEgg.animation === 'sparkle' ? 'bg-white/5' : ''}
                  ${!item.easterEgg.animation ? 'bg-[#111111]' : ''}
                  shadow-xl
                `}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl pt-1 shrink-0">{item.easterEgg.emoji || '✨'}</span>
                    <div className="flex-1 min-w-0 font-bold">
                      <AIResponseRenderer content={item.easterEgg.message} />
                    </div>
                  </div>
                </div>
              )}

              <div className="text-right">
                <span className="text-white text-3xl font-black font-mono">
                  = {isExact ? (
                    <MathDisplay expression={item.result} isResult inline />
                  ) : (
                    <span className="bg-white/5/20 px-2">≈ {item.approxResult || item.result}</span>
                  )}
                </span>
              </div>

              {/* Gráfica generada con plot(expr) */}
              {item.plotData && item.plotData.length > 0 && (
                <div className="h-64 mt-4 w-full bg-[#111111] rounded-2xl p-4 border border-white/10 shadow-xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={item.plotData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="0" stroke="#000" vertical={true} />
                      <XAxis 
                        dataKey="x" 
                        type="number" 
                        domain={['dataMin', 'dataMax']} 
                        stroke="#000" 
                        tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} 
                        tickFormatter={(val) => val.toFixed(1)}
                      />
                      <YAxis 
                        type="number" 
                        domain={['auto', 'auto']} 
                        stroke="#000" 
                        tick={{ fill: '#000', fontSize: 12, fontWeight: 'bold' }} 
                        tickFormatter={(val) => val.toFixed(1)}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '4px solid #000', color: '#000', borderRadius: '0px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                        itemStyle={{ color: '#000', fontWeight: 'black' }}
                        labelFormatter={(label) => `x: ${Number(label).toFixed(2)}`}
                        formatter={(value: number) => [value.toFixed(4), 'y']}
                      />
                      <ReferenceLine y={0} stroke="#000" strokeWidth={2} />
                      <ReferenceLine x={0} stroke="#000" strokeWidth={2} />
                      <Line 
                        type="step" 
                        dataKey="y" 
                        stroke="#000" 
                        strokeWidth={4} 
                        dot={false} 
                        isAnimationActive={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>



      {/* ── Quick Action Bar + Collapsible Toolbar ── */}
      <div className="bg-[#111111] border-t-4 border-white/10 shrink-0 z-20">

        {/* Quick Buttons Row — always visible */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 overflow-x-auto scrollbar-none">
          {/* Toggle toolbar */}
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            className={`shrink-0 px-3 py-2 rounded-2xl text-xs font-black transition-all border border-white/10 shadow-xl ${
              showToolbar
                ? 'bg-white/5 text-white'
                : 'bg-[#111111] text-white hover:bg-white/5/50'
            }`}
            title="Panel de funciones"
          >
            {showToolbar ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          {/* Math Quick Buttons — GeoGebra style */}
          {[
            { label: '∫', val: 'integrar(' },
            { label: 'd/dx', val: 'derivar(' },
            { label: 'Σ', val: 'sumatoria(' },
            { label: 'lim', val: 'limite(' },
            { label: '√', val: 'raiz(' },
            { label: 'xⁿ', val: '^' },
            { label: 'π', val: 'pi' },
            { label: 'e', val: 'e' },
            { label: '(', val: '(' },
            { label: ')', val: ')' },
            { label: ',', val: ',' },
            { label: 'sin', val: 'sen(' },
            { label: 'cos', val: 'cos(' },
            { label: 'tan', val: 'tan(' },
            { label: 'ln', val: 'ln(' },
            { label: 'log', val: 'log(' },
            { label: '|x|', val: 'abs(' },
            { label: 'n!', val: 'factorial(' },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => setInput(input + btn.val)}
              className="shrink-0 px-4 py-2 rounded-2xl text-sm font-mono font-black
                bg-[#111111] border border-white/10 text-white hover:bg-white/5 hover:shadow-xl
                transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none select-none shadow-xl"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Collapsible Toolbar Panel */}
        {showToolbar && (
          <div className="border-t-4 border-white/10 bg-[#111111]">
            {/* Tabs */}
            <div className="flex gap-2 px-4 pt-3 pb-1">
              {(['FUNC', 'ABC', 'GREEK', 'CONST'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setToolbarTab(tab)}
                  className={`px-4 py-2 text-xs font-black rounded-2xl transition-all border border-white/10 shadow-xl ${
                    toolbarTab === tab
                      ? 'bg-white/5 text-white translate-x-[2px] translate-y-[2px] shadow-none'
                      : 'bg-[#111111] text-white hover:bg-white/5/30'
                  }`}
                >
                  {tab === 'GREEK' ? 'αβγ' : tab === 'FUNC' ? 'ƒ(x)' : tab === 'ABC' ? 'xyz' : 'π e c'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 px-4 pb-4 pt-2 max-h-48 overflow-y-auto custom-scrollbar bg-[#111111]">
              {toolbarTab === 'FUNC' && [
                { l: 'sinh', v: 'sinh(' }, { l: 'cosh', v: 'cosh(' }, { l: 'tanh', v: 'tanh(' },
                { l: 'asin', v: 'asin(' }, { l: 'acos', v: 'acos(' }, { l: 'atan', v: 'atan(' },
                { l: 'exp', v: 'exp(' }, { l: 'sqrt', v: 'raiz(' }, { l: 'cbrt', v: 'cbrt(' },
                { l: 'floor', v: 'piso(' }, { l: 'ceil', v: 'techo(' },
                { l: 'nPr', v: 'permutations(' }, { l: 'nCr', v: 'combinations(' },
                { l: 'GCD', v: 'gcd(' }, { l: 'LCM', v: 'lcm(' }, { l: 'mod', v: 'mod(' },
                { l: 'det', v: 'determinant(' }, { l: 'inv', v: 'invert(' }, { l: 'Aᵀ', v: 'transpose(' },
                { l: 'graficar', v: 'graficar(' }, { l: 'sonificar', v: 'sonificar(' },
                { l: 'explicar', v: 'explicar(' }, { l: 'resolver', v: 'resolver(' },
                { l: 'simplificar', v: 'simplificar(' }, { l: 'factorizar', v: 'factorizar(' },
                { l: 'expandir', v: 'expandir(' },
                { l: 'taylor', v: 'taylor(' }, { l: 'laplace', v: 'laplace(' }, { l: 'fourier', v: 'fourier(' },
              ].map(b => (
                <button key={b.l} onClick={() => setInput(input + b.v)}
                  className="px-2 py-2 rounded-2xl text-xs font-mono font-black bg-[#111111] border border-white/10 text-white hover:bg-white/10 shadow-xl transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none truncate">
                  {b.l}
                </button>
              ))}

              {toolbarTab === 'ABC' && 'xyzwabcdefghijk'.split('').map(l => (
                <button key={l} onClick={() => setInput(input + l)}
                  className="px-2 py-2 rounded-2xl text-xs font-mono font-black bg-[#111111] border border-white/10 text-white hover:bg-white/10 shadow-xl transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                  {l}
                </button>
              ))}

              {toolbarTab === 'GREEK' && [
                { l: 'α', v: 'alpha' }, { l: 'β', v: 'beta' }, { l: 'γ', v: 'gamma' }, { l: 'δ', v: 'delta' },
                { l: 'ε', v: 'epsilon' }, { l: 'ζ', v: 'zeta' }, { l: 'η', v: 'eta' }, { l: 'θ', v: 'theta' },
                { l: 'λ', v: 'lambda' }, { l: 'μ', v: 'mu' }, { l: 'ν', v: 'nu' }, { l: 'ξ', v: 'xi' },
                { l: 'ρ', v: 'rho' }, { l: 'σ', v: 'sigma' }, { l: 'τ', v: 'tau' }, { l: 'φ', v: 'phi' },
                { l: 'ψ', v: 'psi' }, { l: 'ω', v: 'omega' }, { l: '∞', v: 'inf' }, { l: '∂', v: 'd' },
                { l: 'Δ', v: 'Delta' }, { l: 'Σ', v: 'sum' }, { l: 'Π', v: 'product' }, { l: 'Ω', v: 'Omega' },
              ].map(b => (
                <button key={b.l} onClick={() => setInput(input + b.v)}
                  className="px-2 py-2 rounded-2xl text-sm font-serif font-black bg-[#111111] border border-white/10 text-white hover:bg-white/10 shadow-xl transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                  {b.l}
                </button>
              ))}

              {toolbarTab === 'CONST' && [
                { l: 'π', v: 'pi', d: 'Pi' }, { l: 'e', v: 'e', d: 'Euler' }, { l: 'i', v: 'i', d: 'Imaginario' },
                { l: 'c', v: 'c', d: 'Luz' }, { l: 'g', v: 'g', d: 'Gravedad' }, { l: 'G', v: 'G', d: 'Newton' },
                { l: 'h', v: 'h', d: 'Planck' }, { l: 'k', v: 'k', d: 'Boltzmann' }, { l: 'Nₐ', v: 'Na', d: 'Avogadro' },
                { l: 'R', v: 'R', d: 'Gas' }, { l: 'mₑ', v: 'me', d: 'Electrón' }, { l: 'mₚ', v: 'mp', d: 'Protón' },
              ].map(b => (
                <button key={b.l} onClick={() => setInput(input + b.v)}
                  className="px-2 py-2 rounded-2xl text-xs font-serif font-black bg-[#111111] border border-white/10 text-white hover:bg-white/10 shadow-xl transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex flex-col items-center">
                  <span className="text-sm leading-none">{b.l}</span>
                  <span className="text-[8px] font-black uppercase leading-none mt-1">{b.d}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Field ── */}
        <div className="px-4 pb-6 pt-3 bg-[#111111]">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black font-serif italic text-white">ƒ</div>
            <input
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                setInput(val);
                const words = val.split(/[\s()+\-*/=,]+/);
                const lastWord = words[words.length - 1];

                if (val.startsWith('/')) {
                  const slashMatches = Object.entries(SLASH_COMMANDS)
                    .filter(([cmd]) => cmd.startsWith(val.toLowerCase()))
                    .slice(0, 5)
                    .map(([cmd, data]) => ({
                      name: cmd,
                      english: cmd,
                      syntax: data.template,
                      description: { es: data.description, en: data.description },
                      category: 'misc' as const
                    }));
                  if (slashMatches.length > 0) {
                    setSuggestions(slashMatches);
                    setShowSuggestions(true);
                    setSelectedSuggestion(0);
                    return;
                  }
                }

                if (lastWord && lastWord.length >= 2) {
                  const matches = getAutocompleteSuggestions(lastWord, 'es', 5);
                  setSuggestions(matches);
                  setShowSuggestions(matches.length > 0);
                  setSelectedSuggestion(0);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onKeyDown={(e) => {
                if (showSuggestions && suggestions.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedSuggestion(prev => (prev + 1) % suggestions.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
                  } else if (e.key === 'Tab' || e.key === 'Enter') {
                    if (showSuggestions && suggestions[selectedSuggestion]) {
                      e.preventDefault();
                      const selected = suggestions[selectedSuggestion];
                      if (selected.name.startsWith('/')) {
                        const template = selected.syntax.replace('▯', '');
                        setInput(template);
                      } else {
                        const words = input.split(/[\s()+\-*/=,]+/);
                        const lastWord = words[words.length - 1];
                        const fnName = selected.name;
                        const newInput = input.slice(0, input.length - lastWord.length) + fnName + '(';
                        setInput(newInput);
                      }
                      setShowSuggestions(false);
                      return;
                    }
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }
                if (e.key === 'Enter' && !showSuggestions) {
                  handleKeyClick('=');
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className={`w-full bg-[#111111] border border-white/10 rounded-2xl py-6 pl-14 pr-4 text-xl lg:text-3xl font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all shadow-xl ${parseError
                ? 'border-red-500/50 bg-red-500/5'
                : ''
                }`}
              placeholder="Escribe una expresión... (ej: derivar(x^2, x))"
              autoFocus
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 bottom-full mb-4 bg-[#111111] border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
                {suggestions.map((fn, idx) => (
                  <div
                    key={fn.name}
                    className={`px-4 py-4 cursor-pointer flex justify-between items-center border-b-2 border-white/10 last:border-b-0 ${idx === selectedSuggestion ? 'bg-white/5 text-white' : 'hover:bg-white/10'
                      }`}
                    onMouseDown={() => {
                      const words = input.split(/[\s()+\-*/=,]+/);
                      const lastWord = words[words.length - 1];
                      const newInput = input.slice(0, input.length - lastWord.length) + fn.name + '(';
                      setInput(newInput);
                      setShowSuggestions(false);
                    }}
                  >
                    <div>
                      <span className="font-black font-mono text-lg">{fn.name}</span>
                      <span className="text-white/60 ml-2 text-sm font-bold">{fn.syntax}</span>
                    </div>
                    <span className="text-xs font-black uppercase text-white/40">{fn.description.es}</span>
                  </div>
                ))}
              </div>
            )}

            {input && !parseError && !showSuggestions && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <MathDisplay expression={input} className="text-white/30 text-sm font-black" />
              </div>
            )}
          </div>

          {/* Parse Error Display */}
          {parseError && (
            <div className="mt-4 flex items-center gap-3 text-white text-sm bg-white/5 px-4 py-3 rounded-2xl border border-white/10 shadow-xl">
              <AlertCircle size={20} className="shrink-0" />
              <span className="font-black uppercase">{parseError}</span>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default ConsoleMode;