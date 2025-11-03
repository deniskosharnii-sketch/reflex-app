'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Brain, BarChart3, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Thought {
  id: string;
  created_at: string;
  audio_text: string;
  mood: string | null;
  reflection_dialogue: any;
  patterns_tagged: string[];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('capture');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Загрузка мыслей из Supabase
  useEffect(() => {
    loadThoughts();
  }, []);

  const loadThoughts = async () => {
    try {
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setThoughts(data || []);
    } catch (err) {
      console.error('Error loading thoughts:', err);
      setError('Не удалось загрузить мысли');
    }
  };

  // Проверка и запрос разрешений микрофона
  const requestMicrophonePermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Ваш браузер не поддерживает запись аудио');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      setMicPermissionGranted(true);
      return stream;
    } catch (err: any) {
      console.error('Microphone permission error:', err);
      setMicPermissionGranted(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.');
      } else if (err.name === 'NotFoundError') {
        throw new Error('Микрофон не найден. Подключите микрофон и попробуйте снова.');
      } else if (err.name === 'NotReadableError') {
        throw new Error('Микрофон используется другим приложением.');
      } else {
        throw new Error(`Ошибка микрофона: ${err.message}`);
      }
    }
  };

  // Запись аудио
  const startRecording = async () => {
    try {
      setError(null);
      
      const stream = await requestMicrophonePermission();
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Не удалось начать запись. Проверьте разрешения микрофона.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  // Транскрипция через Next.js API route
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка транскрипции');
      }

      const data = await response.json();
      setTranscription(data.text);
      setIsProcessing(false);
    } catch (err) {
      console.error('Error transcribing:', err);
      setError('Ошибка распознавания речи');
      setIsProcessing(false);
    }
  };

  // Сохранение мысли в Supabase
  const saveThought = async () => {
    if (!transcription.trim()) return;

    try {
      setIsProcessing(true);
      
      const { error } = await supabase
        .from('thoughts')
        .insert({
          audio_text: transcription,
          mood: selectedMood,
        });

      if (error) throw error;

      setTranscription('');
      setSelectedMood(null);
      await loadThoughts();
      setIsProcessing(false);
    } catch (err) {
      console.error('Error saving thought:', err);
      setError('Не удалось сохранить мысль');
      setIsProcessing(false);
    }
  };

  // Удаление мысли
  const deleteThought = async (id: string) => {
    try {
      const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadThoughts();
    } catch (err) {
      console.error('Error deleting thought:', err);
      setError('Не удалось удалить мысль');
    }
  };

  const moods = [
    { value: 'good', emoji: '😊', label: 'Хорошо' },
    { value: 'neutral', emoji: '😐', label: 'Нейтрально' },
    { value: 'bad', emoji: '😔', label: 'Плохо' },
    { value: 'confused', emoji: '🤔', label: 'Запутанно' },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <h1 className="text-2xl font-bold text-orange-500">Reflex</h1>
        <p className="text-sm text-zinc-400 mt-1">Фиксация мыслей и рефлексия</p>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-md w-full mx-4 flex items-start gap-3">
          <div className="flex-1">
            <p className="font-semibold mb-1">Ошибка</p>
            <p className="text-sm text-red-100">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-100 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {activeTab === 'capture' && (
          <div className="space-y-6">
            {/* Microphone Permission Info */}
            {!micPermissionGranted && (
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="text-orange-500 text-xl">ℹ️</div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-orange-200 font-medium">
                      Для записи мыслей нужен доступ к микрофону
                    </p>
                    <p className="text-xs text-orange-300/80">
                      Нажмите на кнопку записи ниже - браузер запросит разрешение.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recording Section */}
            <div className="bg-zinc-900 rounded-2xl p-8 text-center space-y-6">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto transition-all ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : isProcessing
                    ? 'bg-zinc-700 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                } shadow-2xl`}
              >
                {isProcessing ? (
                  <Loader2 className="w-12 h-12 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-12 h-12" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </button>

              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isRecording
                    ? 'Идет запись...'
                    : isProcessing
                    ? 'Обработка...'
                    : 'Нажмите, чтобы записать мысль'}
                </p>
                {isRecording && (
                  <p className="text-sm text-zinc-400">
                    Нажмите еще раз, чтобы остановить
                  </p>
                )}
              </div>
            </div>

            {/* Transcription Display */}
            {transcription && (
              <div className="bg-zinc-900 rounded-2xl p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Ваша мысль:</label>
                  <textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[120px] resize-none"
                    placeholder="Отредактируйте при необходимости..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Настроение (опционально):</label>
                  <div className="flex gap-2">
                    {moods.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => setSelectedMood(selectedMood === mood.value ? null : mood.value)}
                        className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                          selectedMood === mood.value
                            ? 'bg-orange-600 text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{mood.emoji}</div>
                        <div className="text-xs">{mood.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={saveThought}
                  disabled={isProcessing}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  {isProcessing ? 'Сохранение...' : 'Сохранить мысль'}
                </button>
              </div>
            )}

            {/* Recent Thoughts Preview */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-300 px-2">Последние мысли</h2>
              {thoughts.slice(0, 5).map((thought) => (
                <div
                  key={thought.id}
                  className="bg-zinc-900 rounded-xl p-4 flex justify-between items-start gap-4 group"
                >
                  <div className="flex-1 space-y-2">
                    <p className="text-zinc-200 line-clamp-2">{thought.audio_text}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>{formatDate(thought.created_at)}</span>
                      {thought.mood && (
                        <span className="flex items-center gap-1">
                          {moods.find(m => m.value === thought.mood)?.emoji}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteThought(thought.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {thoughts.length === 0 && (
                <p className="text-center text-zinc-500 py-8">Пока нет мыслей. Запишите первую!</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reflect' && (
          <div className="text-center py-16 space-y-4">
            <Brain className="w-16 h-16 text-orange-500 mx-auto" />
            <h2 className="text-2xl font-bold">Рефлексия</h2>
            <p className="text-zinc-400">Эта функция будет доступна в следующем обновлении</p>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="text-center py-16 space-y-4">
            <BarChart3 className="w-16 h-16 text-orange-500 mx-auto" />
            <h2 className="text-2xl font-bold">Паттерны</h2>
            <p className="text-zinc-400">Эта функция будет доступна в следующем обновлении</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-3 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex justify-around">
          <button
            onClick={() => setActiveTab('capture')}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
              activeTab === 'capture'
                ? 'text-orange-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Mic className="w-6 h-6" />
            <span className="text-xs font-medium">Запись</span>
          </button>
          <button
            onClick={() => setActiveTab('reflect')}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
              activeTab === 'reflect'
                ? 'text-orange-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Brain className="w-6 h-6" />
            <span className="text-xs font-medium">Рефлексия</span>
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
              activeTab === 'patterns'
                ? 'text-orange-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Паттерны</span>
          </button>
        </div>
      </div>
    </div>
  );
}
