/**
 * CAS Cal - Localización Español (México)
 * 
 * Archivo de strings para UI 100% en español.
 * Esto NO es i18n genérico - es español nativo como diferenciador.
 */

export const LABELS = {
  // ==================== NAVEGACIÓN ====================
  sidebar: {
    core: 'Núcleo',
    visualization: 'Visualización',
    linearAlgebra: 'Álgebra Lineal',
    tools: 'Herramientas',
  },

  modes: {
    console: 'Consola CAS',
    graphing: 'Gráficas & Fourier',
    equations: 'Ecuaciones',
    matrix: 'Matrices',
    vectors: 'Vectores',
    statistics: 'Estadística',
    complex: 'Complejos',
    accounting: 'Contador PRO',
    dashboard: 'Mi Cuenta',
  },

  // ==================== TOPBAR ====================
  topBar: {
    feedback: 'Feedback / Ayuda',
    settings: 'Configuración',
    signIn: 'Iniciar Sesión',
    signOut: 'Cerrar Sesión',
    upgrade: 'Mejorar Plan',
  },

  // ==================== CONSOLA ====================
  console: {
    placeholder: 'Escribe tu expresión (ej. derivar(x^2, x))...',
    clear: 'Limpiar',
    copy: 'Copiar',
    history: 'Historial',
    calculate: 'Calcular',
    exact: 'Exacto',
    approx: 'Aproximado',
    backendOnline: 'Backend conectado',
    backendOffline: 'Modo local',
  },

  // ==================== GRAFICADOR ====================
  graphing: {
    standard: 'Gráficas',
    epicycles: 'Epicycles PRO',
    addFunction: 'Agregar función',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    reset: 'Restablecer',
    export: 'Exportar imagen',
  },

  // ==================== MATRICES ====================
  matrix: {
    rows: 'Filas',
    cols: 'Columnas',
    create: 'Crear matriz',
    determinant: 'Determinante',
    inverse: 'Inversa',
    transpose: 'Transpuesta',
    eigenvalues: 'Eigenvalores',
    rref: 'Forma escalonada',
  },

  // ==================== ESTADÍSTICA ====================
  statistics: {
    mean: 'Media',
    median: 'Mediana',
    mode: 'Moda',
    stdDev: 'Desv. Estándar',
    variance: 'Varianza',
    regression: 'Regresión',
    histogram: 'Histograma',
    addData: 'Agregar datos',
  },

  // ==================== CONTADOR ====================
  accounting: {
    npv: 'VAN (Valor Actual Neto)',
    irr: 'TIR (Tasa Interna de Retorno)',
    depreciation: 'Depreciación',
    simpleInterest: 'Interés Simple',
    compoundInterest: 'Interés Compuesto',
    cashFlow: 'Flujo de Caja',
  },

  // ==================== ACCIONES COMUNES ====================
  actions: {
    calculate: 'Calcular',
    clear: 'Limpiar',
    copy: 'Copiar',
    paste: 'Pegar',
    undo: 'Deshacer',
    redo: 'Rehacer',
    save: 'Guardar',
    load: 'Cargar',
    export: 'Exportar',
    import: 'Importar',
  },

  // ==================== ESTADOS ====================
  status: {
    loading: 'Calculando...',
    success: 'Listo',
    error: 'Error',
    empty: 'Sin resultados',
  },
};

// ==================== MENSAJES DE ERROR ====================
export const ERRORES = {
  syntax: 'No entendí esa expresión. Revisa la sintaxis.',
  undefinedVar: 'Esa variable no está definida.',
  divisionZero: 'No puedes dividir entre cero, compa.',
  timeout: 'El cálculo tardó mucho. Simplifica la expresión.',
  apiError: 'Error del servidor. Intenta de nuevo.',
  parseError: 'Revisa los paréntesis y operadores.',
  emptyExpression: 'Escribe algo primero.',
  invalidNumber: 'Ese no es un número válido.',
  matrixSize: 'Las dimensiones de las matrices no coinciden.',
  noSolution: 'No hay solución para esta ecuación.',
  complexResult: 'El resultado incluye números complejos.',
};

// ==================== TIPS Y AYUDA ====================
export const TIPS = {
  derivative: '💡 Usa derivar(f, x) para calcular derivadas',
  integral: '💡 Usa integrar(f, x) o integrar(f, x, a, b) para integrales',
  limit: '💡 Usa limite(f, x, punto) para límites',
  solve: '💡 Usa resolver(ecuacion, x) para encontrar raíces',
  simplify: '💡 Usa simplificar(expr) para reducir expresiones',
  expand: '💡 Usa expandir(expr) para desarrollar productos',
  factor: '💡 Usa factorizar(expr) para factorizar polinomios',
  sonify: '💡 Usa sonify(expr) para escuchar la función como audio',
};

// ==================== SLASH COMMANDS ====================
export const SLASH_COMMANDS: Record<string, { template: string; description: string; cursorPos: number }> = {
  '/derivar': { template: 'derivar(▯, x)', description: 'Derivada respecto a x', cursorPos: 8 },
  '/integrar': { template: 'integrar(▯, x)', description: 'Integral respecto a x', cursorPos: 9 },
  '/limite': { template: 'limite(▯, x, 0)', description: 'Límite cuando x → 0', cursorPos: 7 },
  '/resolver': { template: 'resolver(▯, x)', description: 'Resolver para x', cursorPos: 9 },
  '/simplificar': { template: 'simplificar(▯)', description: 'Simplificar expresión', cursorPos: 12 },
  '/expandir': { template: 'expandir(▯)', description: 'Expandir productos', cursorPos: 9 },
  '/factorizar': { template: 'factorizar(▯)', description: 'Factorizar polinomio', cursorPos: 11 },
  '/taylor': { template: 'taylor(▯, x, 0, 5)', description: 'Serie de Taylor', cursorPos: 7 },
  '/raiz': { template: 'raiz(▯)', description: 'Raíz cuadrada', cursorPos: 5 },
  '/sen': { template: 'sen(▯)', description: 'Seno', cursorPos: 4 },
  '/cos': { template: 'cos(▯)', description: 'Coseno', cursorPos: 4 },
  '/tan': { template: 'tan(▯)', description: 'Tangente', cursorPos: 4 },
  '/ln': { template: 'ln(▯)', description: 'Logaritmo natural', cursorPos: 3 },
  '/log': { template: 'log(▯)', description: 'Logaritmo base 10', cursorPos: 4 },
  '/pi': { template: 'pi', description: 'Constante π', cursorPos: 2 },
  '/e': { template: 'e', description: 'Constante e', cursorPos: 1 },
  '/sonify': { template: 'sonify(▯)', description: 'Escuchar función', cursorPos: 7 },
};

export default LABELS;
