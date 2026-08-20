/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Radio } from 'lucide-react';
import { Footer } from '../Footer';
import { Header } from '../Header';

interface RoleMismatchViewProps {
  onLogout: () => void;
  navigate: (path: string) => void;
}

export const RoleMismatchView: React.FC<RoleMismatchViewProps> = ({
  onLogout,
  navigate,
}) => {
  const title = 'Painel do Voluntário Restrito';

  const description = 'Você está logado como cliente, mas está tentando acessar o painel do voluntário.';

  const primaryButtonLabel = 'Ir para a Área do Cliente';

  const secondaryButtonLabel = 'Trocar de Conta';

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-amber-400 selection:text-black">
      <Header />
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 md:px-12 py-4 md:py-6 flex flex-col gap-6">
        <div
          id="role-mismatch-box-volunteer"
          className="bg-zinc-950 rounded-3xl border border-zinc-900 p-6 sm:p-10 flex flex-col items-center text-center gap-4 mt-8"
        >
          <div className="w-14 h-14 bg-amber-400/10 rounded-full flex items-center justify-center text-amber-400 border border-amber-400/20">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white tracking-tight">{title}</h3>
            <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {description}
            </p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5 justify-center w-full sm:w-auto">
            <button
              id="role-nav-other-btn-volunteer"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-amber-400 text-white font-semibold text-xs rounded-lg transition shadow-md cursor-pointer"
            >
              {primaryButtonLabel}
            </button>
            <button
              id="role-swap-user-btn-volunteer"
              onClick={onLogout}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs rounded-lg transition cursor-pointer"
            >
              {secondaryButtonLabel}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
