import { Database, Info, Lock, Shield, ShieldAlert } from "lucide-react";
import { Separator } from "../ui/separator";

interface TermsContentProps {
  className?: string;
  hideFeedback?: boolean;
}

export function FeedbackSection() {
  return (
    <div className="flex items-start gap-4">
      <div>
        <div>
          <div className="flex gap-4 py-4 border-neutral-800 items-start">
            <div className="mt-1 p-2 bg-amber-500/10 rounded-xl shrink-0">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-neutral-200 mb-1">
                Feedback e Suporte (Beta)
              </p>
              <p className="text-sm text-neutral-400">
                O Aegis é atualmente um software em desenvolvimento (Beta).
                Embora nos esforcemos para garantir estabilidade, bugs podem
                ocorrer. Recomendamos que mantenha backups de dados críticos
                externos ao aplicativo. Caso encontre qualquer bug ou
                comportamento inesperado, por favor relate para:
                <span className="mt-6 block font-bold transition-colors">
                  <span className="font-bold">E-mail:</span>{" "}
                  <span className="text-amber-500/80 select-text">
                    henrilima.contactme@gmail.com
                  </span>
                </span>
                <span className="block font-medium font-mono text-sm mt-0.5">
                  <span className="font-bold">Discord:</span>{" "}
                  <span className="text-amber-500/80 select-text">
                    atlassoatlas
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>
        <Separator />
        <div>
          <div className="flex gap-4 py-4 border-t border-neutral-800 items-start">
            <div className="mt-1 p-2 bg-green-500/10 rounded-xl shrink-0">
              <Shield className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="font-bold text-neutral-200 mb-1">
                Compromisso com a Transparência
              </p>
              <p className="text-sm text-neutral-400">
                A perda da senha mestre impossibilita a recuperação dos dados.
                Você é o único responsável pela sua senha.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TermsContent({
  className = "",
  hideFeedback = false,
}: TermsContentProps) {
  return (
    <div
      className={`space-y-6 text-sm text-neutral-400 overflow-auto pr-3 custom-scrollbar ${className}`}
    >
      <div className="space-y-5">
        <div className="flex gap-4 items-start">
          <div className="mt-1 p-2 bg-neutral-800 rounded-xl shrink-0 border border-neutral-700">
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="font-bold text-neutral-200 mb-1">
              Soberania dos Dados (Local-First)
            </p>
            <p className="leading-relaxed">
              Diferente de serviços em nuvem, o Aegis opera sob o princípio
              "Offline-First". Toda informação que você cria — incluindo senhas,
              notas, histórico de sono e hábitos — é escrita exclusivamente no
              seu disco rígido local.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="mt-1 p-2 bg-neutral-800 rounded-xl shrink-0 border border-neutral-700">
            <Lock className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="font-bold text-neutral-200 mb-1">
              Criptografia de Ponta a Ponta
            </p>
            <p className="leading-relaxed">
              Seus dados sensíveis são protegidos por criptografia AES-256 e
              Argon2id. A chave de criptografia é derivada da sua senha mestre e
              nunca sai do seu computador.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="mt-1 p-2 bg-neutral-800 rounded-xl shrink-0 border border-neutral-700">
            <Info className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="font-bold text-neutral-200 mb-1">
              Identificação de Perfil
            </p>
            <p className="leading-relaxed">
              O e-mail e nome de usuário servem apenas para organizar seus
              perfis locais e permitir a recuperação de acesso ao cofre quando a
              senha mestre é conhecida.
            </p>
          </div>
        </div>

        {!hideFeedback && (
          <div className="pt-4 border-t border-neutral-800/50">
            <FeedbackSection />
          </div>
        )}
      </div>
    </div>
  );
}
