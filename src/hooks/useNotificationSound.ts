import { useCallback } from 'react';

// Função para gerar um tom de notificação usando Web Audio API
const createNotificationSound = (frequency: number = 800, duration: number = 200) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Criar oscilador para o tom
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Conectar oscilador -> ganho -> saída
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configurar o som
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine'; // Onda senoidal para som suave
    
    // Fade in/out para evitar cliques
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000);
    
    // Tocar o som
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
    
    return true;
  } catch (error) {
    console.warn('Web Audio API não disponível:', error);
    return false;
  }
};

// Fallback usando HTML5 Audio com data URL
const createFallbackSound = () => {
  try {
    // Criar um som usando data URL (beep simples)
    const audio = new Audio();
    audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBj2X2O/FdSUFKoHN8dSINwkXY7zn5Z1NEAxPqOX0wWg';
    audio.volume = 0.1;
    audio.play().catch(() => {
      // Silenciar erro se não conseguir tocar
    });
    return true;
  } catch (error) {
    console.warn('Fallback audio não disponível:', error);
    return false;
  }
};

export const useNotificationSound = () => {
  const playSuccessSound = useCallback(() => {
    // Tentar Web Audio API primeiro, depois fallback
    if (!createNotificationSound(800, 300)) {
      createFallbackSound();
    }
  }, []);

  const playAddSound = useCallback(() => {
    // Som mais agudo para adição
    if (!createNotificationSound(1000, 200)) {
      createFallbackSound();
    }
  }, []);

  return {
    playSuccessSound,
    playAddSound,
  };
};