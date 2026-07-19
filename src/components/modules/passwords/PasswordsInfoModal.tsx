"use client";

import { Key, ShieldCheck } from "lucide-react";
import { ModuleGuideContainer } from "@/components/global/ModuleGuideContainer";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  Highlight,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import type { ThemeColorKey } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface PasswordsInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function PasswordsInfoModal({ show, onClose }: PasswordsInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("passwords")}
      title="Cofre de Senhas"
      subtitle="Guia para gestão segura de credenciais"
      closeLabel="Entendido, cofre seguro!"
    >
      <PasswordsGuideContent />
    </ModuleInfoModal>
  );
}

export function PasswordsGuidePanel({ onBack }: { onBack?: () => void }) {
  return (
    <ModuleGuideContainer
      color={getModuleColor("passwords") as ThemeColorKey}
      icon={Key}
      title="Cofre de Senhas"
      subtitle="Guia para gestão segura de credenciais"
      onBack={onBack}
    >
      <PasswordsGuideContent />
    </ModuleGuideContainer>
  );
}

function PasswordsGuideContent() {
  return (
    <>
      <InfoSection icon={ShieldCheck} title="Criptografia de Nível Militar">
        <p className="text-sm text-muted-foreground leading-relaxed">
          O Aegis utiliza o padrão <Highlight>AES-256</Highlight> para proteger
          suas credenciais. Seus dados são transformados em códigos
          indecifráveis antes de tocar o disco:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Segurança Local",
              desc: "Os dados nunca saem do seu computador",
            },
            {
              label: "Zero Knowledge",
              desc: "Ninguém, nem os desenvolvedores, podem ler seus dados",
            },
            {
              label: "Criptografia de Memória",
              desc: "Senhas são limpas da memória após o uso",
            },
            {
              label: "Banco SQLite",
              desc: "Base de dados robusta e criptografada",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Key} title="Duas Camadas de Segurança">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Você pode optar por usar a <Highlight>Senha Mestra</Highlight> (login)
          ou configurar uma <Highlight>Senha do Cofre</Highlight> exclusiva para
          este módulo:
        </p>
        <StatRow
          label="Isolamento"
          value="O cofre pode ter uma senha diferente da conta"
        />
        <StatRow
          label="Auto-Lock"
          value="O cofre bloqueia automaticamente ao fechar o app"
        />
        <StatRow
          label="Import/Export"
          value="Backup seguro em formato compatível"
        />
      </InfoSection>

      <ProTip title="Aviso Crítico">
        <span className="text-foreground font-bold">
          Não existe recuperação de senha.
        </span>{" "}
        Se você esquecer sua Senha Mestra ou do Cofre, os dados tornam-se
        inacessíveis para sempre. Recomendamos guardar sua senha mestra em um
        local físico seguro.
      </ProTip>
    </>
  );
}
