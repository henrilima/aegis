"use client";

import {
  Network,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Type,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { resolveColor } from "@/colors.config";
import { cn } from "@/lib/utils";
import type { Note } from "../types";

interface GraphNode {
  id: number;
  title: string;
  color: string;
  hasCustomColor: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number;
  note: Note;
}

interface GraphLink {
  source: number; // Node id
  target: number; // Node id
}

interface NotesGraphViewProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
}

interface GraphSettings {
  nodeDistance: number; // 60 to 260
  repulsion: number; // 50 to 450
  lineWidth: number; // 0.5 to 5
  nodeSize: number; // 0.6 to 2.0
  fontSize: number; // 9 to 20
  lineColorMode: string; // "theme", "source", or hex string
  linkOpacity: number; // 0.1 to 1.0
  gravity: number; // 0.005 to 0.05
  showLabels: "all" | "connected" | "hover";
}

const DEFAULT_SETTINGS: GraphSettings = {
  nodeDistance: 120,
  repulsion: 180,
  lineWidth: 1.5,
  nodeSize: 1.0,
  fontSize: 11,
  lineColorMode: "theme",
  linkOpacity: 0.55,
  gravity: 0.015,
  showLabels: "all",
};

const DEFAULT_NOTE_COLOR = "#6366f1"; // Índigo elegante e neutro para notas sem cor específica

const LINE_COLORS = [
  {
    id: "theme",
    label: "Neutro",
    color: "bg-muted text-foreground border-border",
  },
  {
    id: "source",
    label: "Origem",
    color: "bg-linear-to-r from-indigo-500 to-cyan-500 text-white",
  },
  { id: "#6366f1", label: "Índigo", color: "bg-indigo-500" },
  { id: "#3b82f6", label: "Azul", color: "bg-blue-500" },
  { id: "#8b5cf6", label: "Roxo", color: "bg-purple-500" },
  { id: "#ec4899", label: "Rosa", color: "bg-pink-500" },
  { id: "#10b981", label: "Verde", color: "bg-emerald-500" },
  { id: "#f59e0b", label: "Âmbar", color: "bg-amber-500" },
  { id: "#94a3b8", label: "Cinza", color: "bg-slate-400" },
];

export function NotesGraphView({ notes, onSelectNote }: NotesGraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [_selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Configurações do Grafo (persistidas)
  const [settings, setSettings] = useState<GraphSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("aegis_graph_settings");
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const updateSetting = <K extends keyof GraphSettings>(
    key: K,
    val: GraphSettings[K],
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: val };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("aegis_graph_settings", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Estados de transformação (Pan e Zoom)
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const [scaleDisplay, setScaleDisplay] = useState(1);

  // Nós e Links da simulação
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const isDraggingNodeRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const animFrameIdRef = useRef<number | null>(null);

  // Resolve a cor do nó a partir da nota
  const getNodeColorInfo = useCallback(
    (note: Note): { color: string; hasCustomColor: boolean } => {
      if (note.color?.trim()) {
        const resolved = resolveColor(note.color.trim());
        if (resolved && resolved !== "#6b7280") {
          return { color: resolved, hasCustomColor: true };
        }
      }
      return { color: DEFAULT_NOTE_COLOR, hasCustomColor: false };
    },
    [],
  );

  // Constrói o Grafo a partir das notas e dos WikiLinks
  useEffect(() => {
    const titleToNoteMap = new Map<string, Note>();
    notes.forEach((n) => {
      if (n.title) {
        titleToNoteMap.set(n.title.trim().toLowerCase(), n);
      }
    });

    const links: GraphLink[] = [];
    const connectionCounts = new Map<number, number>();

    notes.forEach((sourceNote) => {
      if (!sourceNote.id) return;
      const content = sourceNote.content || "";
      const matches = content.matchAll(/\[\[(.*?)\]\]/g);

      for (const match of matches) {
        const targetTitle = match[1]?.trim().toLowerCase();
        if (targetTitle && titleToNoteMap.has(targetTitle)) {
          const targetNote = titleToNoteMap.get(targetTitle);
          if (targetNote?.id && targetNote.id !== sourceNote.id) {
            links.push({ source: sourceNote.id, target: targetNote.id });
            connectionCounts.set(
              sourceNote.id,
              (connectionCounts.get(sourceNote.id) || 0) + 1,
            );
            connectionCounts.set(
              targetNote.id,
              (connectionCounts.get(targetNote.id) || 0) + 1,
            );
          }
        }
      }
    });

    // Cria os nós distribuídos em círculo inicial
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const baseRadiusMult = settings.nodeSize;

    const newNodes: GraphNode[] = notes.map((note, index) => {
      const angle = (index / Math.max(notes.length, 1)) * 2 * Math.PI;
      const distance = 120 + Math.random() * 150;
      const conns = connectionCounts.get(note.id || 0) || 0;

      const existing = nodesRef.current.find((n) => n.id === note.id);
      const colorInfo = getNodeColorInfo(note);

      return {
        id: note.id || index + 1,
        title: note.title || "Nota sem título",
        color: colorInfo.color,
        hasCustomColor: colorInfo.hasCustomColor,
        x: existing ? existing.x : centerX + Math.cos(angle) * distance,
        y: existing ? existing.y : centerY + Math.sin(angle) * distance,
        vx: existing ? existing.vx : 0,
        vy: existing ? existing.vy : 0,
        radius: Math.min(32, Math.max(6, (7 + conns * 3) * baseRadiusMult)),
        connections: conns,
        note,
      };
    });

    nodesRef.current = newNodes;
    linksRef.current = links;

    transformRef.current = { x: 0, y: 0, scale: 1 };
    setScaleDisplay(1);
  }, [notes, getNodeColorInfo, settings.nodeSize]);

  // Loop de física e renderização no Canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodes = nodesRef.current;
    const links = linksRef.current;
    const { x: panX, y: panY, scale } = transformRef.current;
    const currentCfg = settingsRef.current;

    // 1. Simulação física dinâmica com repulsão real
    const kRepulsion = (currentCfg.repulsion || 180) * 90;
    const kSpring = 0.045;
    const springLength = currentCfg.nodeDistance || 120;
    const damping = 0.84;
    const centerGravity = currentCfg.gravity || 0.015;

    // Repulsão entre todos os pares de nós (Lei de Coulomb + Prevenção de Sobreposição)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distSq = dx * dx + dy * dy + 0.01;
        const dist = Math.sqrt(distSq) || 0.1;

        // Força de repulsão eletrostática
        const force =
          (kRepulsion * ((n1.radius + n2.radius) / 20)) / (distSq + 120);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        n1.vx -= fx;
        n1.vy -= fy;
        n2.vx += fx;
        n2.vy += fy;

        // Prevenção de colisão física e sobreposição de círculos
        const minSpace = n1.radius + n2.radius + 16;
        if (dist < minSpace) {
          const overlap = (minSpace - dist) * 0.4;
          const px = (dx / dist) * overlap;
          const py = (dy / dist) * overlap;

          n1.x -= px;
          n1.y -= py;
          n2.x += px;
          n2.y += py;
        }
      }
    }

    // Atração elástica através dos links
    for (const link of links) {
      const source = nodes.find((n) => n.id === link.source);
      const target = nodes.find((n) => n.id === link.target);
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - springLength) * kSpring;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }
    }

    // Gravidade central e amortecimento
    for (const node of nodes) {
      if (draggedNodeRef.current && draggedNodeRef.current.id === node.id) {
        continue;
      }

      node.vx += (centerX - node.x) * centerGravity;
      node.vy += (centerY - node.y) * centerGravity;

      node.vx *= damping;
      node.vy *= damping;

      node.x += node.vx;
      node.y += node.vy;
    }

    // 2. Desenho no Canvas
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(scale, scale);

    const isDark = document.documentElement.classList.contains("dark");
    const activeHovered = hoveredNode;
    const query = searchQuery.trim().toLowerCase();

    // Determina a cor base das linhas com base nas configurações
    const getBaseLinkColor = (sourceNode?: GraphNode) => {
      if (currentCfg.lineColorMode === "source" && sourceNode?.hasCustomColor) {
        return sourceNode.color;
      }
      if (currentCfg.lineColorMode.startsWith("#")) {
        return currentCfg.lineColorMode;
      }
      return isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.15)";
    };

    // Desenha as Arestas (Links)
    for (const link of links) {
      const source = nodes.find((n) => n.id === link.source);
      const target = nodes.find((n) => n.id === link.target);
      if (!source || !target) continue;

      const isConnectedToHover =
        activeHovered &&
        (activeHovered.id === source.id || activeHovered.id === target.id);

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      if (isConnectedToHover) {
        // Destaque suave com a cor do nó em foco (sem ficar grosseiro nem laranja)
        ctx.strokeStyle = activeHovered.color;
        ctx.lineWidth = currentCfg.lineWidth + 0.6;
        ctx.globalAlpha = 0.8;
      } else if (activeHovered) {
        ctx.strokeStyle = getBaseLinkColor(source);
        ctx.lineWidth = currentCfg.lineWidth * 0.7;
        ctx.globalAlpha = 0.08;
      } else {
        ctx.strokeStyle = getBaseLinkColor(source);
        ctx.lineWidth = currentCfg.lineWidth;
        ctx.globalAlpha = currentCfg.linkOpacity;
      }

      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Desenha os Nós (Nodes) usando a cor configurada de cada nota
    for (const node of nodes) {
      const isHovered = activeHovered && activeHovered.id === node.id;
      const isConnected =
        activeHovered &&
        links.some(
          (l) =>
            (l.source === activeHovered.id && l.target === node.id) ||
            (l.target === activeHovered.id && l.source === node.id),
        );
      const isSearchMatch =
        Boolean(query) && node.title.toLowerCase().includes(query);

      let alpha = 1;
      if (activeHovered && !isHovered && !isConnected) {
        alpha = 0.25;
      }
      if (query && !isSearchMatch) {
        alpha = 0.15;
      }

      ctx.globalAlpha = alpha;

      // Halo sutil luminoso no hover (em vez de borda preta dura)
      if (isHovered || isSearchMatch) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 3.5, 0, 2 * Math.PI);
        ctx.strokeStyle = isDark
          ? "rgba(255, 255, 255, 0.4)"
          : "rgba(0, 0, 0, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Círculo preenchido do nó com a cor exata da nota
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Borda sutil de contraste do nó
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = isDark
        ? "rgba(255, 255, 255, 0.25)"
        : "rgba(0, 0, 0, 0.12)";
      ctx.stroke();

      // Decisão de rótulo de texto com base na preferência do usuário
      let shouldShowText = false;
      if (currentCfg.showLabels === "all") {
        shouldShowText =
          scale > 0.5 || isHovered || isConnected || isSearchMatch;
      } else if (currentCfg.showLabels === "connected") {
        shouldShowText =
          isHovered || isConnected || isSearchMatch || node.connections > 1;
      } else {
        shouldShowText = isHovered || isSearchMatch;
      }

      if (shouldShowText) {
        const baseFontSize = currentCfg.fontSize || 11;
        ctx.font = `${isHovered ? "bold " : ""}${baseFontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = isDark
          ? isHovered
            ? "#ffffff"
            : "rgba(255, 255, 255, 0.85)"
          : isHovered
            ? "#111827"
            : "rgba(0, 0, 0, 0.8)";
        ctx.fillText(node.title, node.x, node.y + node.radius + 5);
      }
    }

    ctx.restore();
    animFrameIdRef.current = requestAnimationFrame(render);
  }, [hoveredNode, searchQuery]);

  // Inicia e redimensiona o Canvas
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [render]);

  const screenToWorld = (screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const { x: panX, y: panY, scale } = transformRef.current;
    const clientX = screenX - rect.left;
    const clientY = screenY - rect.top;
    return {
      x: (clientX - panX) / scale,
      y: (clientY - panY) / scale,
    };
  };

  const getNodeAt = (worldX: number, worldY: number): GraphNode | null => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      if (dx * dx + dy * dy <= (node.radius + 6) * (node.radius + 6)) {
        return node;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const node = getNodeAt(x, y);

    if (node) {
      draggedNodeRef.current = node;
      isDraggingNodeRef.current = false;
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      setSelectedNode(node);
    } else {
      isPanningRef.current = true;
      startPanRef.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);

    if (draggedNodeRef.current) {
      const dist = Math.hypot(
        e.clientX - dragStartPosRef.current.x,
        e.clientY - dragStartPosRef.current.y,
      );
      if (dist > 5) {
        isDraggingNodeRef.current = true;
      }
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
    } else if (isPanningRef.current) {
      transformRef.current.x = e.clientX - startPanRef.current.x;
      transformRef.current.y = e.clientY - startPanRef.current.y;
    } else {
      const node = getNodeAt(x, y);
      setHoveredNode(node);
    }
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isPanningRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDraggingNodeRef.current) {
      isDraggingNodeRef.current = false;
      return;
    }
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const node = getNodeAt(x, y);
    if (node) {
      onSelectNote(node.note);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(
      3,
      Math.max(0.25, transformRef.current.scale * zoomFactor),
    );

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    transformRef.current.x =
      mouseX -
      (mouseX - transformRef.current.x) *
        (newScale / transformRef.current.scale);
    transformRef.current.y =
      mouseY -
      (mouseY - transformRef.current.y) *
        (newScale / transformRef.current.scale);
    transformRef.current.scale = newScale;
    setScaleDisplay(Number(newScale.toFixed(2)));
  };

  const handleZoomIn = () => {
    const newScale = Math.min(3, transformRef.current.scale * 1.2);
    transformRef.current.scale = newScale;
    setScaleDisplay(Number(newScale.toFixed(2)));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.25, transformRef.current.scale * 0.8);
    transformRef.current.scale = newScale;
    setScaleDisplay(Number(newScale.toFixed(2)));
  };

  const handleResetView = () => {
    transformRef.current = { x: 0, y: 0, scale: 1 };
    setScaleDisplay(1);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-162.5 min-h-125 flex-1 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-xs overflow-hidden select-none animate-in fade-in duration-300"
    >
      {/* Canvas Interativo */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Barra Superior: Busca de nós e estatísticas */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none gap-3">
        <div className="flex items-center gap-2 bg-background/90 backdrop-blur-md p-1.5 px-3 rounded-xl border border-border/40 pointer-events-auto">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar nós do grafo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/60 w-44 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/40 text-xs text-muted-foreground font-medium">
            <Network className="w-3.5 h-3.5 text-primary" />
            <span>
              {notes.length} {notes.length === 1 ? "nota" : "notas"} ·{" "}
              {linksRef.current.length} conexões
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen((o) => !o)}
            className={cn(
              "p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center",
              isSettingsOpen
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background/90 backdrop-blur-md border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
            title="Personalizar física e aparência do grafo"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Painel de Ajustes e Personalização do Grafo (Scrollável e Isolado) */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-label="Ajustes do Grafo"
          onWheel={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute top-16 right-4 w-84 max-h-[calc(100%-5rem)] overflow-y-auto custom-scrollbar bg-card/95 backdrop-blur-md border border-border/60 rounded-2xl p-4 text-foreground z-30 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold">Ajustes do Grafo</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Controle: Força de Repulsão dos Nós */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
              <span>Força de Repulsão</span>
              <span className="font-bold text-foreground">
                {settings.repulsion}
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={400}
              step={10}
              value={settings.repulsion}
              onChange={(e) =>
                updateSetting("repulsion", Number(e.target.value))
              }
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Controle: Distância das Conexões (Molas) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
              <span>Distância dos Nós</span>
              <span className="font-bold text-foreground">
                {settings.nodeDistance}px
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={260}
              step={10}
              value={settings.nodeDistance}
              onChange={(e) =>
                updateSetting("nodeDistance", Number(e.target.value))
              }
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Controle: Tamanho dos Nós */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
              <span>Tamanho dos Nós</span>
              <span className="font-bold text-foreground">
                {settings.nodeSize}x
              </span>
            </div>
            <input
              type="range"
              min={0.6}
              max={2.0}
              step={0.1}
              value={settings.nodeSize}
              onChange={(e) =>
                updateSetting("nodeSize", Number(e.target.value))
              }
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Controle: Tamanho do Texto (Fonte) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <Type className="w-3 h-3 text-muted-foreground" />
                Tamanho da Fonte
              </span>
              <span className="font-bold text-foreground">
                {settings.fontSize}px
              </span>
            </div>
            <input
              type="range"
              min={9}
              max={18}
              step={1}
              value={settings.fontSize}
              onChange={(e) =>
                updateSetting("fontSize", Number(e.target.value))
              }
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Controle: Espessura da Linha */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
              <span>Espessura das Linhas</span>
              <span className="font-bold text-foreground">
                {settings.lineWidth}px
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.5}
              value={settings.lineWidth}
              onChange={(e) =>
                updateSetting("lineWidth", Number(e.target.value))
              }
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Controle: Opacidade da Linha */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
              <span>Opacidade das Linhas</span>
              <span className="font-bold text-foreground">
                {Math.round(settings.linkOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={settings.linkOpacity}
              onChange={(e) =>
                updateSetting("linkOpacity", Number(e.target.value))
              }
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Controle: Cor das Linhas */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Cor das Linhas
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LINE_COLORS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateSetting("lineColorMode", item.id)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1",
                    settings.lineColorMode === item.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/30",
                  )}
                >
                  <span
                    className={cn(
                      "w-2.5 h-2.5 rounded-full border border-border/40 inline-block",
                      item.color,
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Controle: Gravidade Central */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
              <span>Gravidade Central</span>
              <span className="font-bold text-foreground">
                {Math.round(settings.gravity * 1000)}
              </span>
            </div>
            <input
              type="range"
              min={0.005}
              max={0.04}
              step={0.005}
              value={settings.gravity}
              onChange={(e) => updateSetting("gravity", Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Controle: Exibição de Rótulos de Texto */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Exibição dos Rótulos
            </span>
            <div className="grid grid-cols-3 gap-1 bg-muted/40 p-1 rounded-xl border border-border/30">
              {(
                [
                  { id: "all", label: "Sempre" },
                  { id: "connected", label: "Relevantes" },
                  { id: "hover", label: "Hover" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateSetting("showLabels", opt.id)}
                  className={cn(
                    "py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center",
                    settings.showLabels === opt.id
                      ? "bg-card text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controles de Zoom Flutuantes no Canto Inferior Direito */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-background/90 backdrop-blur-md p-1.5 rounded-xl border border-border/40 pointer-events-auto">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="Aproximar"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-bold text-muted-foreground px-1 min-w-9.5 text-center">
          {Math.round(scaleDisplay * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="Afastar"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-3.5 bg-border/60 mx-0.5" />
        <button
          type="button"
          onClick={handleResetView}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="Centralizar e resetar"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Tooltip informativo do Nó em Foco */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-md p-3 rounded-xl border border-border/40 pointer-events-auto max-w-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: hoveredNode.color }}
            />
            <h4 className="text-xs font-bold text-foreground truncate">
              {hoveredNode.title}
            </h4>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between gap-4">
            <span>
              {hoveredNode.connections}{" "}
              {hoveredNode.connections === 1 ? "conexão" : "conexões"}
            </span>
            <span className="text-primary text-[10px] font-bold">
              Clique para abrir
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
