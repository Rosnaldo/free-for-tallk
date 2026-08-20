import React, { useState, useRef } from 'react';
import { Header } from '../../components/Header.tsx';
import { Edit2, Check, UploadCloud, ArrowLeft } from 'lucide-react';
import { OnlineUser } from '@repo/shared-types';
import { mytoast } from '../../components/toast.tsx';
import { handleRequestError } from '../../utils/utils.ts';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../../components/Footer.tsx';


interface UserProfilePageProps {
  fileError: string | null;
  avatarUrl: string | null;
  currentUser?: OnlineUser;
  navigate: (path: string) => void;
  processFile: (file: File) => Promise<void>;
}

interface TitleProps {
  id?: string;
  label?: string;
  className?: string;
}

export const Title: React.FC<TitleProps> = ({
  id = 'title',
  label = 'Profile',
  className = '',
}) => {
  return (
    <div id={`${id}-container`} className={`mt-0 mb-3 ${className}`}>
      <h1
        id={id}
        className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1"
      >
        {label}
      </h1>
    </div>
  );
};

interface BackToPanelButtonProps {
  className?: string;
}

export const BackToPanelButton: React.FC<BackToPanelButtonProps> = ({ className = '' }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className={`group flex items-center gap-2 text-xs font-semibold text-white hover:text-amber-400 transition-colors cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      Voltar ao Painel
    </button>
  );
};

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  fileError,
  avatarUrl,
  currentUser,
  navigate,
  processFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const fullName = currentUser.name;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(fullName);
  const [isDragging, setIsDragging] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCancel = () => {
    setName(fullName);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      navigate('/');
    }, 1500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const loadingToast = mytoast("Changing avatar...");
      try {
        await processFile(file);
      } catch (error) {
        console.log("Error in handleFileChange:", error);
        handleRequestError(error);
      } finally {
        mytoast.dismiss(loadingToast);
      }
    };
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const loadingToast = mytoast("Changing avatar...");
    try {
      await processFile(file);
    } catch (error) {
      handleRequestError(error);
    } finally {
      mytoast.dismiss(loadingToast);
    }
  };

  const initials = fullName.charAt(0).toUpperCase();

  return (
    <div id="user-profile-page-view" className="min-h-screen bg-black flex flex-col font-sans">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8">

        {/* Back link */}
        <div className="mb-8">
          <BackToPanelButton />
        </div>

        <Title label="Profile" />

        {/* 2-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

          {/* LEFT: identity details */}
          <div className="flex flex-col h-full">
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 flex flex-col h-full">

              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="text-[10px] font-bold font-mono text-amber-400 tracking-widest uppercase mb-1">
                    — §01 Identidade
                  </div>
                  <h3 className="text-xl font-black text-white">Seus dados</h3>
                </div>

                {!isEditing ? (
                  <button
                    id="edit-profile-btn"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-white cursor-pointer transition-all focus:outline-none"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                    Editar
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      id="save-profile-btn"
                      onClick={handleSave}
                      disabled={saveSuccess}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-ochre hover:bg-brand-ochre-hover text-white rounded-xl text-xs font-bold cursor-pointer transition-all focus:outline-none disabled:opacity-70"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {saveSuccess ? "Salvo" : "Salvar"}
                    </button>
                    <button
                      id="cancel-profile-btn"
                      onClick={handleCancel}
                      className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 cursor-pointer transition-all focus:outline-none"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 flex-grow">
                {/* Full Name */}
                <div className="border-b border-zinc-900 pb-3">
                  <label className="block text-[10px] font-mono tracking-wider text-zinc-400 uppercase mb-1.5">
                    Nome completo
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={50}
                      placeholder="Seu nome visível..."
                      className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-ochre"
                    />
                  ) : (
                    <p className="text-sm font-bold text-white">{fullName}</p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div className="border-b border-zinc-900 pb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase">
                      Email
                    </label>
                    <span className="px-1.5 py-0.5 bg-zinc-900 text-[8px] font-mono text-zinc-400 rounded uppercase font-bold tracking-widest border border-zinc-800">
                      somente leitura
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 font-mono">{currentUser.email}</p>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: avatar upload */}
          <div className="flex flex-col h-full">
            <div
              id="avatar-photo-upload-card"
              className={`bg-zinc-950 border rounded-2xl p-5 flex flex-col items-center justify-center text-center h-full min-h-[260px] relative transition-all duration-300 ${
                isDragging ? 'border-dashed border-brand-ochre bg-zinc-900/40 scale-[1.01]' : 'border-zinc-900'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="relative group mb-4">
                <div className="w-24 h-24 rounded-full border border-zinc-800 overflow-hidden flex items-center justify-center bg-brand-ochre text-white shadow-md relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-extrabold tracking-tight text-white select-none">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer pointer-events-none">
                  <UploadCloud className="w-5 h-5 text-white" />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                id="photo-upload-selector-btn"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-white cursor-pointer transition-all focus:outline-none mb-3.5"
              >
                Upload Photo
              </button>

              <span className="text-[10px] tracking-wide text-zinc-400 leading-relaxed max-w-[180px]">
                Formato da imagem: JPG, PNG ou GIF. Tamanho máximo: 2MB.
              </span>

              {fileError && (
                <div className="mt-4 p-2 bg-red-950/40 border border-red-900/50 rounded-xl text-[10px] text-red-400 font-medium">
                  {fileError}
                </div>
              )}

              {isDragging && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center p-4 select-none pointer-events-none">
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shrink-0 mb-3 shadow-md">
                    <UploadCloud className="w-8 h-8 text-brand-ochre animate-bounce" />
                  </div>
                  <span className="text-xs font-bold text-white">Soltar imagem aqui</span>
                  <span className="text-[9px] text-zinc-400 mt-1">Soltar para atualizar</span>
                </div>
              )}
            </div>
          </div>

        </div>


      </main>
      <Footer />
    </div>
  );
};
