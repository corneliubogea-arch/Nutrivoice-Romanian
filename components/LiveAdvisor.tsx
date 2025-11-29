import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { UserProfile, AudioSettings, DEFAULT_AUDIO_SETTINGS, TranscriptItem } from '../types';
import { Visualizer } from './Visualizer';
import { SettingsModal } from './SettingsModal';
import { createPcmBlob, base64ToBytes, decodeAudioData } from '../utils/audio';
import { Mic, MicOff, X, RefreshCw, Settings, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface LiveAdvisorProps {
  profile: UserProfile;
  onEndSession: () => void;
}

export const LiveAdvisor: React.FC<LiveAdvisorProps> = ({ profile, onEndSession }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  // We keep the state for the UI, but we default to robust settings for the actual connection
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<Promise<any> | null>(null);
  
  // Transcription accumulation refs
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    sourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    
    if (sessionRef.current) {
        sessionRef.current.then(session => {
            try { session.close(); } catch (e) {}
        });
        sessionRef.current = null;
    }

    setIsConnected(false);
  };

  const startSession = async () => {
    setError(null);
    cleanup(); 
    setTranscript([]); // Clear transcript on new session start

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      // REVERT: Force 16000Hz for input stability. This is the "First Version" behavior.
      // We ignore the variable sampleRate from settings to ensure it works.
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      const inputCtx = inputAudioContextRef.current;
      const outputCtx = outputAudioContextRef.current;
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      const systemInstruction = `
        Ești un nutriționist profesionist și un consilier culinar prietenos care vorbește limba Română.
        
        Profilul utilizatorului este:
        - Nume: ${profile.name}
        - Vârstă: ${profile.age} ani
        - Sex: ${profile.sex}
        - Greutate: ${profile.weight} kg
        - Înălțime: ${profile.height} cm
        - Stil de viață: ${profile.lifestyle}
        - Detalii extra: ${profile.dietaryPreferences}

        Sarcina ta este să oferi sfaturi culinare, idei de rețete și sfaturi de dietă personalizate strict pe baza acestui profil.
        Fii empatic, încurajator și concis. Nu vorbi prea mult deodată. Angajează-te într-o conversație naturală.
      `;

      // REVERT: Use simple, standard constraints that are known to work everywhere.
      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
              channelCount: 1,
              sampleRate: 16000,
              echoCancellation: audioSettings.echoCancellation,
              noiseSuppression: audioSettings.noiseSuppression,
              autoGainControl: audioSettings.autoGainControl
          } 
      });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: systemInstruction,
            // Fixed: Empty objects enable transcription, do not pass model here
            inputAudioTranscription: {},
            outputAudioTranscription: {}
        },
        callbacks: {
            onopen: () => {
                setIsConnected(true);
                
                const source = inputCtx.createMediaStreamSource(stream);
                const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                
                scriptProcessor.onaudioprocess = (e) => {
                    if (!isMicOn) return;
                    
                    // REVERT: Removed Sensitivity/RMS check. 
                    // We send audio CONTINUOUSLY to ensure the model always hears the user.
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData, 16000);
                    
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
                // Handle Transcription
                if (msg.serverContent?.outputTranscription) {
                  currentOutputTranscriptionRef.current += msg.serverContent.outputTranscription.text;
                } else if (msg.serverContent?.inputTranscription) {
                  currentInputTranscriptionRef.current += msg.serverContent.inputTranscription.text;
                }

                if (msg.serverContent?.turnComplete) {
                  const userText = currentInputTranscriptionRef.current.trim();
                  const modelText = currentOutputTranscriptionRef.current.trim();

                  if (userText) {
                    setTranscript(prev => [...prev, { role: 'user', text: userText, timestamp: new Date() }]);
                    currentInputTranscriptionRef.current = '';
                  }
                  if (modelText) {
                    setTranscript(prev => [...prev, { role: 'model', text: modelText, timestamp: new Date() }]);
                    currentOutputTranscriptionRef.current = '';
                  }
                }

                // Handle Audio
                const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio) {
                    try {
                        const audioData = base64ToBytes(base64Audio);
                        const audioBuffer = await decodeAudioData(audioData, outputCtx, 24000, 1);
                        
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputNode);
                        
                        nextStartTimeRef.current = Math.max(
                            nextStartTimeRef.current,
                            outputCtx.currentTime
                        );
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        
                        sourcesRef.current.add(source);
                        source.onended = () => sourcesRef.current.delete(source);
                    } catch (err) {
                        console.error("Error decoding audio", err);
                    }
                }

                if (msg.serverContent?.interrupted) {
                    sourcesRef.current.forEach(s => s.stop());
                    sourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                    currentOutputTranscriptionRef.current = ''; 
                }
            },
            onclose: () => {
                setIsConnected(false);
            },
            onerror: (err) => {
                console.error("Session error:", err);
                setError("Eroare de conexiune.");
                cleanup();
            }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Setup error:", err);
      setError(`Eroare: ${err.message}`);
      cleanup();
    }
  };

  useEffect(() => {
    startSession();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    setIsMicOn(prev => !prev);
  };

  const handleSaveSettings = (newSettings: AudioSettings) => {
      setAudioSettings(newSettings);
      // Re-start session with new settings
      startSession();
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - (margin * 2);
    
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105); // Emerald 600
    doc.text("NutriVoice - Conversație", margin, yPosition);
    yPosition += 10;

    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Data: ${new Date().toLocaleDateString('ro-RO')}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Utilizator: ${profile.name}`, margin, yPosition);
    yPosition += 15;

    // Content
    doc.setFontSize(11);

    transcript.forEach((item) => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }

        const isUser = item.role === 'user';
        const roleLabel = isUser ? "Tu" : "NutriVoice";
        const color = isUser ? [75, 85, 99] : [5, 150, 105]; // Gray vs Emerald

        doc.setFont("helvetica", "bold");
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(`${roleLabel} (${item.timestamp.toLocaleTimeString('ro-RO', {hour: '2-digit', minute:'2-digit'})}):`, margin, yPosition);
        yPosition += 6;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(0); // Black text
        
        const textLines = doc.splitTextToSize(item.text, maxLineWidth);
        doc.text(textLines, margin, yPosition);
        
        yPosition += (textLines.length * 6) + 8; // Line height + Spacing
    });

    doc.save(`nutrivoice_conversatie_${Date.now()}.pdf`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-emerald-50 to-teal-100 p-4">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-2 rounded-lg font-bold text-sm">NV</div>
            <span className="font-semibold text-emerald-800 hidden sm:block">NutriVoice</span>
        </div>
        <div className="flex gap-2">
            {transcript.length > 0 && (
                <button 
                    onClick={downloadPDF}
                    className="bg-white/50 hover:bg-white/80 text-emerald-700 p-2 rounded-full transition"
                    title="Descarcă PDF Conversație"
                >
                    <FileText size={24} />
                </button>
            )}
            <button 
                onClick={() => setShowSettings(true)}
                className="bg-white/50 hover:bg-white/80 text-slate-600 p-2 rounded-full transition"
                title="Setări Audio"
            >
                <Settings size={24} />
            </button>
            <button 
                onClick={onEndSession}
                className="bg-white/50 hover:bg-white/80 text-slate-600 p-2 rounded-full transition"
                title="Încheie sesiunea"
            >
                <X size={24} />
            </button>
        </div>
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        currentSettings={audioSettings}
        onSave={handleSaveSettings}
      />

      {/* Main Content */}
      <div className="flex flex-col items-center gap-12 w-full max-w-md">
        
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">
                {isConnected ? 'Te ascult...' : 'Se conectează...'}
            </h2>
            <p className="text-slate-500">
                {isConnected 
                    ? 'Vorbește liber despre obiectivele tale alimentare.' 
                    : 'Stabilim conexiunea cu asistentul tău.'}
            </p>
            {transcript.length > 0 && (
                <div className="text-xs text-emerald-600 mt-2 bg-emerald-100/50 px-3 py-1 rounded-full inline-block">
                    {transcript.length} mesaje transcrise
                </div>
            )}
        </div>

        <Visualizer isActive={isConnected} />

        {/* Error Display */}
        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center max-w-xs border border-red-100">
                <p className="mb-2">{error}</p>
                <button 
                    onClick={() => startSession()}
                    className="flex items-center justify-center gap-2 mx-auto bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition"
                >
                    <RefreshCw size={16} /> Reîncearcă
                </button>
            </div>
        )}

        {/* Controls */}
        {isConnected && (
            <div className="flex items-center gap-6">
                <button
                    onClick={toggleMic}
                    className={`p-6 rounded-full shadow-lg transition-all transform hover:scale-105 ${
                        isMicOn 
                        ? 'bg-emerald-600 text-white shadow-emerald-200' 
                        : 'bg-slate-200 text-slate-500 shadow-inner'
                    }`}
                >
                    {isMicOn ? <Mic size={32} /> : <MicOff size={32} />}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};