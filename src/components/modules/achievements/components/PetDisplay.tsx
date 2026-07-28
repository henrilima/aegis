"use client";

import { AlertTriangle, Check, Edit2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getXPForLevel } from "@/config/achievements.config";
import {
  COMPLETED_TODAY_PHRASES,
  GENERAL_MOTIVATIONAL_PHRASES,
  getPetPhrases,
  PARTICLES_CONFIG,
} from "@/config/pets.config";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { formatDateLocal } from "@/lib/utils";

// Retorna o período do dia com base na hora local:
// day (06h–12h), afternoon (12h–19h), night (19h–06h)
function getTimePeriod(now: Date): "day" | "afternoon" | "night" {
  const hour = now.getHours();
  if (hour >= 6 && hour < 16) return "day";
  if (hour >= 12 && hour < 19) return "afternoon";
  return "night";
}

interface PetDisplayProps {
  selectedPet: string;
  selectedParticle?: string;
  selectedBgMode?: "cyclic" | "day" | "afternoon" | "night";
  treeLevel: number;
  treeXp: number;
  last3DaysCompletedCount: number;
  allCompleted: boolean;
  completedToday: boolean;
  lastCompletedDate?: string | null;
}

const DISPLAY_SIZE = 96;

interface ParticleInstance {
  id: number;
  x: number; // posição inicial X (% da largura)
  y: number; // posição inicial Y (% da altura, a partir do fundo)
  delay: number;
  duration: number;
  scale: number;
  angle: number;
  image?: string;
}

export function PetDisplay({
  selectedPet,
  selectedParticle,
  selectedBgMode,
  treeLevel,
  treeXp,
  last3DaysCompletedCount,
  allCompleted,
  completedToday,
  lastCompletedDate,
}: PetDisplayProps) {
  const { now } = useTime();
  // Estado e persistência local para o nome personalizado do pet
  const [customName, setCustomName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>("");

  // Período do dia para selecionar o fundo correto; atualiza automaticamente quando simulatedNow muda
  const timePeriod = useMemo(() => {
    if (selectedBgMode && selectedBgMode !== "cyclic") {
      return selectedBgMode;
    }
    return getTimePeriod(now);
  }, [now, selectedBgMode]);

  // Estado do balão de fala ao clicar no pet
  const [speechText, setSpeechText] = useState<string | null>(null);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const uid = user?.id ? String(user.id) : "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = uid
        ? `aegis_pet_custom_name_${uid}_${selectedPet}`
        : `aegis_pet_custom_name_${selectedPet}`;
      const saved =
        localStorage.getItem(key) ??
        localStorage.getItem(`aegis_pet_custom_name_${selectedPet}`);
      setCustomName(saved || "");
    }
  }, [selectedPet, uid]);

  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus();
    }
  }, [isEditingName]);

  const handleSaveName = (newName: string) => {
    setCustomName(newName);
    if (typeof window !== "undefined") {
      const key = uid
        ? `aegis_pet_custom_name_${uid}_${selectedPet}`
        : `aegis_pet_custom_name_${selectedPet}`;
      localStorage.setItem(key, newName);
      window.dispatchEvent(new Event("aegis-pet-renamed"));
    }
    setIsEditingName(false);
  };

  const daysSinceLastCompletion = useMemo(() => {
    if (!lastCompletedDate) return null;
    const currentDateStr = formatDateLocal(now);
    if (currentDateStr === lastCompletedDate) return 0;

    const currentD = new Date(`${currentDateStr}T00:00:00`);
    const lastD = new Date(`${lastCompletedDate}T00:00:00`);
    const diffTime = currentD.getTime() - lastD.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  }, [now, lastCompletedDate]);

  // O pet começa em estado "death" se o nível for 1 e XP for 0 (progresso é 0),
  // ou se não concluiu nenhum desafio nos últimos 4 dias.
  const isDead =
    last3DaysCompletedCount === 0 ||
    (daysSinceLastCompletion !== null && daysSinceLastCompletion >= 4) ||
    (treeLevel === 1 && treeXp === 0);

  const [particles, setParticles] = useState<ParticleInstance[]>([]);

  useEffect(() => {
    if (!selectedParticle || selectedParticle === "none" || isDead) {
      setParticles([]);
      return;
    }

    const config = PARTICLES_CONFIG[selectedParticle];
    if (!config) {
      setParticles([]);
      return;
    }

    const count =
      selectedParticle === "undertale"
        ? 7
        : selectedParticle === "hearts"
          ? 6
          : 12;
    const newParticles: ParticleInstance[] = [];
    const isUndertale = selectedParticle === "undertale";

    for (let i = 0; i < count; i++) {
      let image: string | undefined;
      if (config.type === "image" && config.images) {
        if (isUndertale) {
          image = config.images[i % config.images.length];
        } else {
          image =
            config.images[Math.floor(Math.random() * config.images.length)];
        }
      }

      // Posicionamento base das partículas
      let x = Math.random() * 80 + 10;
      let y = Math.random() * 60 + 10;

      if (selectedParticle === "hearts") {
        // Centraliza horizontalmente ao redor do pet de forma mais espalhada (35% a 65%)
        x = Math.random() * 30 + 35;
        // Começa perto do pet verticalmente com mais espalhamento (10% a 40%)
        y = Math.random() * 30 + 10;
      } else if (isUndertale) {
        // Almas começam centralizadas no topo do cenário horizontalmente (em torno de 50%)
        // Com 7 almas e espaçamento de 2.2%, elas cobrem de 43.4% a 56.6%
        x = 50 + (i - 3) * 2.2;
        y = 83; // Perto do topo (83% bottom)
      }

      const p: ParticleInstance = {
        id: i,
        x,
        y,
        delay: isUndertale ? 0 : Math.random() * 4,
        duration: isUndertale ? 8 : Math.random() * 3 + 3,
        scale: isUndertale ? 1 : Math.random() * 0.4 + 0.8,
        angle: Math.random() * 360,
        image,
      };

      newParticles.push(p);
    }

    setParticles(newParticles);
  }, [selectedParticle, isDead]);

  // Refs para elementos DOM das almas de Undertale (animação via rAF)
  const soulRefs = useRef<(HTMLDivElement | null)[]>([]);
  const soulAnimRef = useRef<number | null>(null);

  // Animação JS das almas de Undertale: topo → descida → órbita ao redor do pet → subida imediata → espera no topo
  useEffect(() => {
    if (selectedParticle !== "undertale" || particles.length === 0) {
      if (soulAnimRef.current !== null) {
        cancelAnimationFrame(soulAnimRef.current);
        soulAnimRef.current = null;
      }
      return;
    }

    // Configuração de tempos (em milissegundos)
    const DESCEND_MS = 1200; // Tempo de descida suave do topo até o pet
    const ORBIT_MS = 2800; // Tempo de órbita completa (360 graus) ao redor do pet
    const ACTIVE_DOWN_MS = DESCEND_MS + ORBIT_MS; // 4000ms de descida e rotação ativa

    // Stagger de descida: 1/7 do tempo ativo
    const STAGGER_DOWN_MS = ACTIVE_DOWN_MS / 7;
    const ASCENT_MS = 1600; // Tempo de subida suave de volta ao topo

    // A última subida (i=6) termina aos (6 * 571.4) + 4000 + 1600 = 9028.5ms.
    // Mantemos uma pausa coletiva no topo de ~4 segundos antes de reiniciar o ciclo:
    const CYCLE_MS = 13000; // Duração de 1 ciclo completo (13 segundos)

    const CX = 50; // Centro horizontal do pet
    const CY = 18; // Centro vertical do pet (mais baixo para descer mais no Y)
    const RX = 13; // Raio horizontal da órbita
    const RY = 12; // Raio vertical da órbita
    const angleStart = Math.PI / 2; // Começa no ponto superior da elipse (para descer do topo direto para o topo do pet)
    const startTime = performance.now();

    // Funções de easing para suavidade
    const easeOut = (t: number) => 1 - (1 - t) ** 3;
    const _easeIn = (t: number) => t * t * t;

    const animate = (now: number) => {
      const elapsed = (now - startTime) % CYCLE_MS;

      particles.forEach((p, i) => {
        const el = soulRefs.current[i];
        if (!el) return;

        const startDown = i * STAGGER_DOWN_MS;
        const endDown = startDown + ACTIVE_DOWN_MS;
        const startUp = endDown; // Sobe imediatamente ao fim da descida/órbita
        const endUp = startUp + ASCENT_MS;

        let x = p.x;
        let y = p.y;
        let opacity = 0.6;

        if (elapsed < startDown) {
          // 1. Aguardando no topo antes de descer
          x = p.x;
          y = p.y;
          opacity = 0.6;
        } else if (elapsed <= endDown) {
          // 2. Descida e Órbita ativa
          const lp = (elapsed - startDown) / ACTIVE_DOWN_MS; // Progresso da fase (0..1)
          const descendLimit = DESCEND_MS / ACTIVE_DOWN_MS; // Ponto de divisão entre descida e órbita

          if (lp < descendLimit) {
            // Descida linear: do topo até o início da órbita (CX, CY + RY)
            const prog = lp / descendLimit;
            const targetX = CX;
            const targetY = CY + RY;
            x = p.x + (targetX - p.x) * prog;
            y = p.y + (targetY - p.y) * prog;
            opacity = 0.6 + 0.4 * prog;
          } else {
            // Órbita: 360 graus ao redor do pet
            const orbitProg = (lp - descendLimit) / (1 - descendLimit);
            const angle = angleStart + orbitProg * 2 * Math.PI;
            x = CX + RX * Math.cos(angle);
            y = CY + RY * Math.sin(angle);
            opacity = 1.0;
          }
        } else if (elapsed <= endUp) {
          // 3. Subida ativa (easeOut): sobe direto e desacelera apenas quando chega no topo
          const lp = (elapsed - startUp) / ASCENT_MS; // Progresso local (0..1)
          const prog = easeOut(lp);
          const startX = CX;
          const startY = CY + RY;
          x = startX + (p.x - startX) * prog;
          y = startY + (p.y - startY) * prog;
          opacity = 1.0 - 0.4 * prog;
        } else {
          // 4. Aguardando no topo após subir até o fim do ciclo global
          x = p.x;
          y = p.y;
          opacity = 0.6;
        }

        el.style.left = `${x}%`;
        el.style.bottom = `${y}%`;
        el.style.opacity = `${opacity}`;
      });

      soulAnimRef.current = requestAnimationFrame(animate);
    };

    soulAnimRef.current = requestAnimationFrame(animate);
    return () => {
      if (soulAnimRef.current !== null) {
        cancelAnimationFrame(soulAnimRef.current);
        soulAnimRef.current = null;
      }
    };
  }, [selectedParticle, particles]);

  const renderParticleElement = (p: ParticleInstance) => {
    if (selectedParticle === "undertale" && p.image) {
      return (
        <img
          src={p.image}
          alt="Soul"
          className="w-4 h-4 object-contain select-none pointer-events-none"
          style={{ imageRendering: "pixelated" }}
        />
      );
    }

    const colorMap: Record<string, string> = {
      hearts: "text-red-500 fill-red-500",
      stars: "text-yellow-400 fill-yellow-400",
    };

    const color = colorMap[selectedParticle || ""] || "text-foreground";

    if (selectedParticle === "hearts") {
      return (
        <svg
          className={`w-3.5 h-3.5 ${color}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    }

    if (selectedParticle === "stars") {
      return (
        <svg
          className={`w-3.5 h-3.5 ${color}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    }

    return null;
  };

  const getAnimationClass = () => {
    if (selectedParticle === "hearts") {
      return "animate-particle-rise";
    }
    if (selectedParticle === "stars") {
      return "animate-particle-twinkle";
    }
    // Almas Undertale são animadas por JS via requestAnimationFrame
    return "";
  };

  const [activeAnimation, setActiveAnimation] = useState<
    "Idle" | "Walk" | "Attack"
  >("Idle");

  // Define o estado de animação: Death, Idle, Walk ou Attack
  const animationState = isDead ? "Death" : activeAnimation;

  const bgRef = useRef<HTMLDivElement>(null);
  const bgOffsetRef = useRef(0);
  const bgSpeedRef = useRef(0);

  // Efeito de rolagem parallax suave do fundo (aceleração/desaceleração)
  useEffect(() => {
    let animationFrameId: number;

    const updateBg = () => {
      // Define a velocidade alvo: se estiver andando/correndo, 1.11px por frame (~66px/s), senão 0
      const targetSpeed = animationState === "Walk" ? 1.11 : 0;

      // Ajusta a velocidade gradualmente (fator 0.05 para acelerar/desacelerar suavemente)
      bgSpeedRef.current += (targetSpeed - bgSpeedRef.current) * 0.05;

      if (bgRef.current) {
        bgOffsetRef.current -= bgSpeedRef.current;
        bgRef.current.style.backgroundPositionX = `${bgOffsetRef.current}px`;
      }

      animationFrameId = requestAnimationFrame(updateBg);
    };

    animationFrameId = requestAnimationFrame(updateBg);
    return () => cancelAnimationFrame(animationFrameId);
  }, [animationState]);

  // Verifica se o pet atual possui animação de ataque (Mascotes 1 a 4)
  const hasAttackAnimation = useMemo(() => {
    const attackPets = ["doberman", "shiba", "gato_cerveja", "gato_preto"];
    return attackPets.includes(selectedPet);
  }, [selectedPet]);

  useEffect(() => {
    if (isDead) return;

    setActiveAnimation("Walk");

    // Se concluiu todas as tarefas, o pet tende a descansar feliz (Idle),
    // mas ainda sim alterna esporadicamente para Walk ou Attack
    const interval = setInterval(() => {
      const rand = Math.random();
      if (allCompleted) {
        // Mais chances de Idle (70%)
        if (hasAttackAnimation) {
          if (rand < 0.7) {
            setActiveAnimation("Idle");
          } else if (rand < 0.9) {
            setActiveAnimation("Walk");
          } else {
            setActiveAnimation("Attack");
          }
        } else {
          if (rand < 0.75) {
            setActiveAnimation("Idle");
          } else {
            setActiveAnimation("Walk");
          }
        }
      } else {
        // Se ainda tem tarefas pendentes: alterna entre caminhar (Walk), descansar (Idle) ou brincar (Attack)
        if (hasAttackAnimation) {
          if (rand < 0.4) {
            setActiveAnimation("Idle");
          } else if (rand < 0.85) {
            setActiveAnimation("Walk");
          } else {
            setActiveAnimation("Attack");
          }
        } else {
          if (rand < 0.5) {
            setActiveAnimation("Idle");
          } else {
            setActiveAnimation("Walk");
          }
        }
      }
    }, 8000); // Alterna o comportamento a cada 8 segundos

    return () => clearInterval(interval);
  }, [isDead, hasAttackAnimation, allCompleted]);

  // Efeito para fazer a animação de ataque rodar apenas uma vez (800ms) e voltar para Idle
  useEffect(() => {
    if (activeAnimation === "Attack") {
      const timeout = setTimeout(() => {
        setActiveAnimation("Idle");
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [activeAnimation]);

  // Retorna uma frase aleatória com base no pet selecionado, progresso do dia e estado da animação
  const getRandomPhrase = useCallback(
    (overrideState?: "Idle" | "Walk" | "Attack") => {
      if (isDead) {
        const deathPhrases = getPetPhrases(selectedPet, "Death");
        return deathPhrases[Math.floor(Math.random() * deathPhrases.length)];
      }

      const state = overrideState ?? activeAnimation;
      const petPhrases = getPetPhrases(selectedPet, state) || [];
      const motivationalPhrases = allCompleted
        ? COMPLETED_TODAY_PHRASES
        : GENERAL_MOTIVATIONAL_PHRASES;

      if (petPhrases.length === 0 && motivationalPhrases.length === 0)
        return "";
      if (petPhrases.length === 0) {
        return motivationalPhrases[
          Math.floor(Math.random() * motivationalPhrases.length)
        ];
      }
      if (motivationalPhrases.length === 0) {
        return petPhrases[Math.floor(Math.random() * petPhrases.length)];
      }

      const choosePet = Math.random() < 0.5;
      if (choosePet) {
        return petPhrases[Math.floor(Math.random() * petPhrases.length)];
      }
      return motivationalPhrases[
        Math.floor(Math.random() * motivationalPhrases.length)
      ];
    },
    [selectedPet, activeAnimation, isDead, allCompleted],
  );

  const lastClickTimeRef = useRef(0);

  // Lida com o clique no pet: ativa animação de ataque (se disponível) e exibe balão de fala
  const handlePetClick = useCallback(() => {
    const now = Date.now();
    // Cooldown de 6 segundos entre cliques de interação
    if (now - lastClickTimeRef.current < 6000) {
      return;
    }
    lastClickTimeRef.current = now;

    let targetState = activeAnimation;
    if (!isDead && hasAttackAnimation && activeAnimation === "Idle") {
      setActiveAnimation("Attack");
      targetState = "Attack";
    }

    const phrase = getRandomPhrase(targetState);
    setSpeechText(phrase);

    // Limpa timeout anterior se houver
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    const duration = Math.max(3000, phrase.length * 75);
    speechTimeoutRef.current = setTimeout(() => {
      setSpeechText(null);
    }, duration);
  }, [isDead, hasAttackAnimation, activeAnimation, getRandomPhrase]);

  // Mantém uma referência estável da função para evitar reinicializar o timer a cada mudança de estado da animação
  const getRandomPhraseRef = useRef(getRandomPhrase);
  useEffect(() => {
    getRandomPhraseRef.current = getRandomPhrase;
  }, [getRandomPhrase]);

  // Efeito para fazer o pet soltar falas aleatórias de forma autônoma em momentos aleatórios
  useEffect(() => {
    if (isDead) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextSpeech = () => {
      // Tempo aleatório entre 25 e 60 segundos
      const delay = Math.random() * (60_000 - 25_000) + 25_000;

      timeoutId = setTimeout(() => {
        const timeSinceLastClick = Date.now() - lastClickTimeRef.current;

        // Se o usuário interagiu recentemente (menos de 20 segundos), adia a fala espontânea
        if (timeSinceLastClick < 20000) {
          scheduleNextSpeech();
          return;
        }

        setSpeechText((current) => {
          // Se já houver um balão na tela, não sobrescreve
          if (current) return current;

          const phrase = getRandomPhraseRef.current();

          // Configura o encerramento do balão após 3 segundos
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
          }
          const duration = Math.max(3000, phrase.length * 75);
          speechTimeoutRef.current = setTimeout(() => {
            setSpeechText(null);
          }, duration);

          return phrase;
        });

        // Agenda o próximo ciclo
        scheduleNextSpeech();
      }, delay);
    };

    scheduleNextSpeech();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isDead]);

  // Nível de perigo de vitalidade:
  // 0 = seguro, 1 = atenção, 2 = perigo crítico (1 dia restante), 3 = morto
  const daysRemaining = useMemo(() => {
    if (isDead) return 0;
    if (completedToday || daysSinceLastCompletion === 0) return 4;
    if (daysSinceLastCompletion === 1) return 3;
    if (daysSinceLastCompletion === 2) return 2;
    if (daysSinceLastCompletion === 3) return 1;
    if (daysSinceLastCompletion !== null && daysSinceLastCompletion >= 4)
      return 0;

    // Fallback usando a contagem de dias com atividades caso não haja data de última conclusão
    if (last3DaysCompletedCount >= 2) return 3;
    if (last3DaysCompletedCount === 1) return 1;
    return 0;
  }, [
    isDead,
    completedToday,
    daysSinceLastCompletion,
    last3DaysCompletedCount,
  ]);

  // Envia notificação nativa quando vitalidade está em perigo crítico (1 dia restante),
  // mas apenas uma vez por dia para não spammar o usuário.
  useEffect(() => {
    if (daysRemaining !== 1) return;

    const today = formatDateLocal(now);
    const lastNotifKey = "aegis_pet_danger_notif_date";
    const lastNotifDate = localStorage.getItem(lastNotifKey);
    if (lastNotifDate === today) return;

    const sendNotif = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("global_send_critical_notification", {
          title: "Seu mascote está em perigo! 🐾",
          body: "Conclua pelo menos uma missão hoje ou seu pet irá desmaiar!",
        });
        localStorage.setItem(lastNotifKey, today);
      } catch {
        // Silencia o erro: o app pode estar rodando no navegador
      }
    };

    sendNotif();
  }, [daysRemaining, now]);

  // Limpa o timeout do balão ao desmontar o componente
  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  // Mapeia nomes de exibição amigáveis para cada pet ID
  const petName = useMemo(() => {
    const names: Record<string, string> = {
      doberman: "Doberman",
      shiba: "Shiba",
      gato_cerveja: "Gato Cerveja",
      gato_preto: "Gato Preto",
      rato_marrom: "Rato Marrom",
      rato_azul: "Rato Azul",
      passaro: "Pássaro",
      pombo: "Pombo",
      slime: "Slime",
    };
    return names[selectedPet] || "Mascote";
  }, [selectedPet]);

  // Retorna a quantidade de frames do spritesheet do pet e animação correspondente
  const frameCount = useMemo(() => {
    if (animationState === "Idle") {
      if (selectedPet === "slime") return 6;
      return 4;
    }
    if (animationState === "Attack") return 4;
    if (animationState === "Walk") {
      if (selectedPet === "rato_marrom" || selectedPet === "rato_azul")
        return 4;
      if (selectedPet === "slime") return 8;
      return 6;
    }

    if (animationState === "Death") {
      if (selectedPet === "rato_azul") return 2;
      if (selectedPet === "slime") return 10;
      return 4;
    }
    return 4;
  }, [selectedPet, animationState]);

  // Tamanho do pet na tela (escalado para 96x96px para ficar visível e pixelado)
  const totalWidth = frameCount * DISPLAY_SIZE;

  const xpNeeded = getXPForLevel(treeLevel);
  const xpPercent = Math.min(100, Math.max(0, (treeXp / xpNeeded) * 100));

  // Mensagem descritiva do estado
  const statusMessage = useMemo(() => {
    if (isDead) {
      return "Seu pet desmaiou devido à falta de atividades. Conclua o desafio de hoje para revivê-lo!";
    }
    if (allCompleted) {
      return "Seu pet está descansando feliz porque você concluiu as tarefas diárias de hoje!";
    }
    return "Seu pet está caminhando ao seu lado. Conclua o desafio diário para dar descanso a ele!";
  }, [isDead, allCompleted]);

  // Configuração de estilo de animação: se estiver desmaiado (Death), roda uma única vez
  // e pára no último frame (forwards). Caso contrário (Idle/Walk), roda em loop infinito.
  const animationStyle = useMemo(() => {
    if (animationState === "Death") {
      const lastFrameOffset = totalWidth - DISPLAY_SIZE;
      return {
        animation: `play-spritesheet-once 0.8s steps(${Math.max(1, frameCount - 1)}) forwards`,
        "--spritesheet-last-frame-width": `-${lastFrameOffset}px`,
        backgroundPositionX: `-${lastFrameOffset}px`,
      } as React.CSSProperties;
    }
    return {
      animation: `play-spritesheet 0.8s steps(${frameCount}) infinite`,
      "--spritesheet-width": `-${totalWidth}px`,
    } as React.CSSProperties;
  }, [animationState, frameCount, totalWidth]);

  // Badge de vitalidade e indicador de dias restantes
  const vitalityBadge = useMemo(() => {
    if (isDead) {
      return {
        label: "Desmaiado",
        className: "bg-red-500/10 border-red-500/30 text-red-500",
      };
    }
    if (daysRemaining === 1) {
      return {
        label: "⚠ Fraco • 1 dia para o desmaio",
        className: "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse",
      };
    }
    if (daysRemaining === 2) {
      return {
        label: "Alerta • 2 dias para o desmaio",
        className: "bg-amber-500/10 border-amber-500/30 text-amber-500",
      };
    }
    if (daysRemaining === 3) {
      return {
        label: "Estável • 3 dias para o desmaio",
        className: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
      };
    }
    return {
      label: "Saudável • 4 dias para o desmaio",
      className: "bg-green-500/10 border-green-500/30 text-green-500",
    };
  }, [isDead, daysRemaining]);

  return (
    <div className="p-6 rounded-2xl border border-border/70 bg-card/30 flex flex-col items-center text-center justify-between gap-4 h-full">
      <div className="flex items-center justify-between w-full border-b border-border/50 pb-3">
        <span className="text-xs font-semibold text-muted-foreground">
          Mascote Aegis
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${vitalityBadge.className}`}
          >
            {vitalityBadge.label}
          </span>
        </div>
      </div>

      {/* Indicador de alerta de vitalidade (aparece somente quando em perigo) */}
      {!isDead && daysRemaining <= 2 && (
        <div
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border animate-in fade-in duration-300 ${
            daysRemaining === 1
              ? "border-red-500/20 bg-red-500/5 text-red-500"
              : "border-amber-500/20 bg-amber-500/5 text-amber-500"
          }`}
        >
          <AlertTriangle
            className={`w-3.5 h-3.5 shrink-0 ${daysRemaining === 1 ? "text-red-500" : "text-amber-500"}`}
          />
          <p className="text-[11px] leading-snug text-left">
            {daysRemaining === 1
              ? "Último dia! Conclua uma missão hoje ou seu pet irá desmaiar!"
              : `Restam apenas ${daysRemaining} dias até o desmaio. Complete uma missão para dar energia ao seu pet!`}
          </p>
        </div>
      )}

      {/* Renderizador do Mascote Pixel-Art com interatividade de clique */}
      <div className="relative flex items-end justify-center h-48 w-full pb-8 select-none overflow-hidden rounded-xl border border-border/40 bg-muted/5 @container[size]">
        {/* Imagem de Fundo (pets/backgorunds/pets-background-default-day.jpg) */}
        <div
          ref={bgRef}
          className={`absolute inset-0 transition-all duration-500 ${
            isDead ? "grayscale-80 brightness-60 contrast-110" : "brightness-85"
          }`}
          style={{
            backgroundImage: `url("/pets/backgrounds/default/background-${timePeriod}.jpg")`,
            backgroundSize: "auto 160%", // Preenche altura de forma ampliada, repete horizontalmente
            backgroundRepeat: "repeat-x",
            backgroundPosition: "bottom",
            imageRendering: "pixelated",
            transitionProperty:
              "filter, opacity, brightness, contrast, saturate",
          }}
        />

        {/* Camada de Partículas do Mascote */}
        {particles.map((p, idx) => {
          const isUndertale = selectedParticle === "undertale";
          return (
            <div
              key={p.id}
              // Almas Undertale: ref para animação JS via rAF (sem CSS animation)
              ref={
                isUndertale
                  ? (el) => {
                      soulRefs.current[idx] = el;
                    }
                  : undefined
              }
              className={`absolute pointer-events-none select-none ${
                isUndertale ? "" : getAnimationClass()
              }`}
              style={
                {
                  "--p-duration": `${p.duration}s`,
                  "--drift": `${Math.sin(p.id) * 8}px`,
                  "--drift-end": `${Math.cos(p.id) * 12}px`,
                  "--rot": `${p.angle}deg`,
                  left: `${p.x}%`,
                  bottom: `${p.y}%`,
                  animationDelay: isUndertale ? undefined : `${p.delay}s`,
                  transform: isUndertale ? undefined : `scale(${p.scale})`,
                  zIndex: 5,
                } as React.CSSProperties
              }
            >
              {renderParticleElement(p)}
            </div>
          );
        })}

        {/* Balão de fala pixel-art exibido ao clicar no pet */}
        {speechText && (
          <div
            className="absolute z-20 bottom-25 left-1/2 -translate-x-1/2 animate-in fade-in zoom-in-75 duration-150 pointer-events-none"
            style={{ imageRendering: "pixelated" }}
          >
            <div
              className="relative px-2.5 py-1.5 text-[10px] font-bold text-foreground leading-snug max-w-35 text-center"
              style={{
                background: "var(--card)",
                border: "2px solid var(--border)",
                outline: "2px solid var(--background)",
                boxShadow: "2px 2px 0 var(--border)",
                fontFamily: "monospace",
              }}
            >
              {speechText}
              {/* Ponteiro do balão (estilo pixel-art) */}
              <span
                className="absolute left-1/2 -translate-x-1/2 -bottom-2.5 block w-2 h-2"
                style={{
                  background: "var(--card)",
                  borderRight: "2px solid var(--border)",
                  borderBottom: "2px solid var(--border)",
                  outlineOffset: "-1px",
                  transform: "translateX(-50%) rotate(45deg)",
                }}
              />
            </div>
          </div>
        )}

        {/* Área clicável + div animada em pixel-art */}
        <button
          type="button"
          className="relative z-10 cursor-pointer focus:outline-none"
          onClick={handlePetClick}
          aria-label="Mascote"
        >
          <div
            style={{
              width: `${DISPLAY_SIZE}px`,
              height: `${DISPLAY_SIZE}px`,
              backgroundImage: `url("/pets/${encodeURIComponent(selectedPet)}/${animationState}.png")`,
              backgroundSize: `${totalWidth}px ${DISPLAY_SIZE}px`,
              imageRendering: "pixelated",
              backgroundRepeat: "no-repeat",
              ...animationStyle,
            }}
          />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 w-full items-center">
        {isEditingName ? (
          <div className="flex items-center gap-1.5 max-w-52.5 w-full animate-in fade-in duration-200">
            <input
              ref={inputRef}
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveName(tempName.trim());
                } else if (e.key === "Escape") {
                  setIsEditingName(false);
                }
              }}
              className="text-xs px-2.5 py-1 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 w-full text-center"
              placeholder="Nome do pet"
            />
            <button
              type="button"
              onClick={() => handleSaveName(tempName.trim())}
              className="p-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black transition-colors cursor-pointer shrink-0"
              title="Confirmar"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => setIsEditingName(false)}
              className="p-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors cursor-pointer shrink-0 border border-border"
              title="Cancelar"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <h3>
            <button
              type="button"
              className="text-sm font-bold text-foreground leading-tight flex items-center gap-1.5 cursor-pointer hover:text-amber-500 transition-colors select-none outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded px-1"
              onClick={() => {
                setTempName(customName || petName);
                setIsEditingName(true);
              }}
              title="Clique para renomear seu pet"
            >
              {customName || petName}{" "}
              <Edit2 className="w-2.5 h-2.5 text-muted-foreground" />
            </button>
          </h3>
        )}
        <p className="text-[11px] text-muted-foreground leading-snug px-3">
          {statusMessage}
        </p>
      </div>

      {/* Progresso de XP da Árvore / Pet */}
      <div className="w-full flex flex-col gap-1.5 px-3 mt-1.5 border-t border-border/40 pt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-muted-foreground">
            Progresso do Pet (Nível {treeLevel})
          </span>
          <span className="font-bold text-green-500">
            {treeXp} / {xpNeeded} XP
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border/30">
          <div
            className="h-full bg-linear-to-r from-green-600 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
