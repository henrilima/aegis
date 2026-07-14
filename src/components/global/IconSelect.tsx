"use client";

import {
  Activity,
  AlarmClock,
  AlertCircle,
  Archive,
  Atom,
  Award,
  Bell,
  Book,
  Bookmark,
  // Ícones de Lucide
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  Calendar,
  Camera,
  CheckSquare,
  ChevronDown,
  Clipboard,
  Clock,
  Code2,
  Coffee,
  Compass,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Dumbbell,
  Eye,
  FileText,
  Film,
  Flame,
  Folder,
  FolderOpen,
  Gamepad2,
  Gift,
  Globe,
  GraduationCap,
  HardDrive,
  Headphones,
  Heart,
  HelpCircle,
  History,
  Hourglass,
  Image,
  Inbox,
  Info,
  Key,
  Landmark,
  Languages,
  Laptop,
  Layout,
  Library,
  Lightbulb,
  Link,
  ListTodo,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  Music,
  Palette,
  Pencil,
  PenTool,
  Phone,
  PiggyBank,
  Pin,
  Ruler,
  School,
  Search,
  Send,
  Settings,
  Shield,
  ShoppingBag,
  Smile,
  Star,
  Sun,
  Target,
  Timer,
  Trash,
  TrendingUp,
  Trophy,
  Tv,
  User,
  Users,
  Video,
  Wifi,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn, getColorTheme } from "@/lib/utils";

// Lista centralizada e exportada de ícones disponíveis em todo o sistema (85 ícones)
export const ALL_ICONS = {
  // Estudos / Escrita
  bookOpen: { icon: BookOpen, label: "Livro Aberto" },
  book: { icon: Book, label: "Livro" },
  bookmark: { icon: Bookmark, label: "Marcador" },
  brain: { icon: Brain, label: "Mente / Estudos" },
  award: { icon: Award, label: "Prêmio / Medalha" },
  graduationCap: { icon: GraduationCap, label: "Formação / Diploma" },
  school: { icon: School, label: "Escola / Faculdade" },
  library: { icon: Library, label: "Biblioteca" },
  pencil: { icon: Pencil, label: "Lápis" },
  penTool: { icon: PenTool, label: "Caneta / Design" },
  ruler: { icon: Ruler, label: "Régua / Medida" },
  landmark: { icon: Landmark, label: "História / Landmark" },
  history: { icon: History, label: "Histórico" },
  languages: { icon: Languages, label: "Idiomas / Tradução" },
  calculator: { icon: Calculator, label: "Matemática / Cálculo" },
  atom: { icon: Atom, label: "Física / Ciências / Átomo" },
  globe: { icon: Globe, label: "Globo / Mundo" },

  // Tempo / Organização
  clock: { icon: Clock, label: "Relógio / Tempo" },
  alarmClock: { icon: AlarmClock, label: "Alarme" },
  timer: { icon: Timer, label: "Cronômetro" },
  hourglass: { icon: Hourglass, label: "Ampulheta" },
  calendar: { icon: Calendar, label: "Calendário" },
  bell: { icon: Bell, label: "Notificação / Sino" },
  pin: { icon: Pin, label: "Fixar / Alfinete" },
  clipboard: { icon: Clipboard, label: "Prancheta" },
  checkSquare: { icon: CheckSquare, label: "Checklist" },
  listTodo: { icon: ListTodo, label: "Lista de Tarefas" },
  inbox: { icon: Inbox, label: "Caixa de Entrada" },
  archive: { icon: Archive, label: "Arquivar" },
  folder: { icon: Folder, label: "Pasta" },
  folderOpen: { icon: FolderOpen, label: "Pasta Aberta" },
  fileText: { icon: FileText, label: "Documento / Relatório" },

  // Foco / Metas / Saúde
  flame: { icon: Flame, label: "Foco / Fogo / Meta" },
  target: { icon: Target, label: "Objetivo / Alvo" },
  trophy: { icon: Trophy, label: "Conquista / Troféu" },
  dumbbell: { icon: Dumbbell, label: "Treino / Academia / Saúde" },
  activity: { icon: Activity, label: "Atividade / Pulso" },
  heart: { icon: Heart, label: "Coração / Saúde / Amor" },
  star: { icon: Star, label: "Estrela / Favorito" },
  lightbulb: { icon: Lightbulb, label: "Ideia / Lâmpada" },
  shield: { icon: Shield, label: "Escudo / Segurança" },

  // Trabalho / TI / Tecnologia
  code: { icon: Code2, label: "Programação / TI" },
  laptop: { icon: Laptop, label: "Notebook / Trabalho" },
  database: { icon: Database, label: "Banco de Dados" },
  hardDrive: { icon: HardDrive, label: "Disco Rígido" },
  cpu: { icon: Cpu, label: "Processador / CPU" },
  wifi: { icon: Wifi, label: "Internet / Wifi" },
  briefcase: { icon: Briefcase, label: "Negócios / Trabalho" },
  layout: { icon: Layout, label: "Layout / Grid" },
  key: { icon: Key, label: "Chave / Acesso" },
  lock: { icon: Lock, label: "Segurança / Cadeado" },
  send: { icon: Send, label: "Enviar / Telegram" },
  mail: { icon: Mail, label: "E-mail / Carta" },
  messageSquare: { icon: MessageSquare, label: "Chat / Mensagem" },
  phone: { icon: Phone, label: "Telefone / Contato" },
  settings: { icon: Settings, label: "Configuração" },

  // Finanças
  dollarSign: { icon: DollarSign, label: "Dinheiro / Dólar" },
  creditCard: { icon: CreditCard, label: "Cartão de Crédito" },
  piggyBank: { icon: PiggyBank, label: "Cofrinho / Poupança" },
  trendingUp: { icon: TrendingUp, label: "Crescimento / Investimento" },
  shoppingBag: { icon: ShoppingBag, label: "Compras / Sacola" },

  // Lazer / Criação / Geral
  palette: { icon: Palette, label: "Paleta / Arte" },
  music: { icon: Music, label: "Música / Som" },
  film: { icon: Film, label: "Filme / Cinema" },
  camera: { icon: Camera, label: "Câmera / Foto" },
  tv: { icon: Tv, label: "Televisão / Mídia" },
  headphones: { icon: Headphones, label: "Fone de Ouvido" },
  gamepad: { icon: Gamepad2, label: "Jogos / Controle" },
  coffee: { icon: Coffee, label: "Café / Pausa" },
  user: { icon: User, label: "Perfil / Único" },
  users: { icon: Users, label: "Pessoas / Grupo" },
  compass: { icon: Compass, label: "Geografia / Bússola / Rumo" },
  mapPin: { icon: MapPin, label: "Mapa / Endereço" },
  image: { icon: Image, label: "Imagem / Foto" },
  link: { icon: Link, label: "Link / Conexão" },
  trash: { icon: Trash, label: "Excluir / Lixeira" },
  video: { icon: Video, label: "Vídeo / Gravação" },
  smile: { icon: Smile, label: "Humor / Feliz" },
  gift: { icon: Gift, label: "Presente / Recompensa" },
  sun: { icon: Sun, label: "Dia / Sol / Brilho" },
  moon: { icon: Moon, label: "Noite / Sono / Lua" },
  eye: { icon: Eye, label: "Visualizar / Olho" },
  helpCircle: { icon: HelpCircle, label: "Ajuda / Dúvida" },
  alertCircle: { icon: AlertCircle, label: "Alerta / Cuidado" },
  info: { icon: Info, label: "Informação" },
};

export type IconKey = keyof typeof ALL_ICONS;

// Helper para obter o ícone de forma segura
export function getSystemIcon(key?: string | null) {
  if (!key) return BookOpen;
  const iconData = ALL_ICONS[key as IconKey];
  return iconData ? iconData.icon : BookOpen;
}

interface IconSelectProps {
  value: string;
  onChange: (value: string) => void;
  color?: string; // Cor do tema ativo para estilização
}

export function IconSelect({ value, onChange, color }: IconSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const m = getColorTheme(color || "blue");

  // Fecha o popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Limpa a busca quando fecha/abre
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const selectedData = ALL_ICONS[value as IconKey] || ALL_ICONS.bookOpen;
  const SelectedIcon = selectedData.icon;

  // Filtra os ícones com base na pesquisa
  const filteredIcons = Object.entries(ALL_ICONS).filter(([_, data]) =>
    data.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Botão de Trigger do Select */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-11 px-4 flex items-center justify-between bg-card border border-border rounded-xl text-sm text-foreground hover:border-border/80 transition-all cursor-pointer relative z-10",
          isOpen && "border-blue-500/30",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn("p-1.5 rounded-lg border", m.bg, m.border, m.text)}
          >
            <SelectedIcon className="w-4 h-4" />
          </div>
          <span className="font-medium">{selectedData.label}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Popover/Dropdown de Busca */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-2">
          {/* Campo de Input de Busca */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ícones..."
              className="w-full h-10 pl-9 pr-4 text-xs bg-background border border-border/80 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-blue-500/30 focus:outline-none transition-all"
            />
          </div>

          <div className="h-px bg-border/40 my-0.5" />

          {/* Grade de Ícones Rolável e Compacta (8 colunas) */}
          <div className="grid grid-cols-8 gap-1.5 p-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
            {filteredIcons.length === 0 ? (
              <div className="col-span-8 py-6 text-center text-xs text-muted-foreground">
                Nenhum ícone encontrado.
              </div>
            ) : (
              filteredIcons.map(([key, data]) => {
                const IconOption = data.icon;
                const isSelected = value === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onChange(key);
                      setIsOpen(false);
                    }}
                    title={data.label}
                    className={cn(
                      "w-9 h-9 flex items-center justify-center rounded-lg border transition-all cursor-pointer",
                      isSelected
                        ? `${m.bg} ${m.text} ${m.border}`
                        : "bg-card border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    <IconOption className="w-4 h-4" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
