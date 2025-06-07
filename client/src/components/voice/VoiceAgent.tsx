import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAgentProps {
  onResponse: (response: string) => void;
  onComplete?: () => void;
  prompt?: string;
  isActive?: boolean;
  agentPersonality?: 'friendly' | 'professional' | 'romantic' | 'playful';
  className?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceAgent({
  onResponse,
  onComplete,
  prompt = "Hi! I'm your relationship companion. How can I help you today?",
  isActive = true,
  agentPersonality = 'friendly',
  className = ''
}: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(prompt);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'agent' | 'user';
    message: string;
    timestamp: Date;
  }>>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true);
      synthRef.current = speechSynthesis;
      
      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          setInterimTranscript('');
          handleUserInput(finalTranscript.trim());
        } else {
          setInterimTranscript(interimTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Speak text using text-to-speech
  const speak = useCallback((text: string) => {
    if (!synthRef.current || !isSupported) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice based on personality
    const voices = synthRef.current.getVoices();
    let selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    
    switch (agentPersonality) {
      case 'romantic':
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman')
        ) || selectedVoice;
        utterance.pitch = 1.1;
        utterance.rate = 0.9;
        break;
      case 'professional':
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        break;
      case 'playful':
        utterance.pitch = 1.2;
        utterance.rate = 1.1;
        break;
      default: // friendly
        utterance.pitch = 1.05;
        utterance.rate = 0.95;
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [agentPersonality, isSupported]);

  // Handle user voice input
  const handleUserInput = useCallback((input: string) => {
    if (!input.trim()) return;
    
    // Add to conversation history
    setConversationHistory(prev => [...prev, {
      type: 'user',
      message: input,
      timestamp: new Date()
    }]);
    
    // Process the input and generate response
    onResponse(input);
    
    // Stop listening temporarily while processing
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [onResponse, isListening]);

  // Start/stop listening
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
    }
  }, [isListening, isSupported]);

  // Agent response function (to be called from parent)
  const respondAsAgent = useCallback((message: string) => {
    setCurrentMessage(message);
    setConversationHistory(prev => [...prev, {
      type: 'agent',
      message,
      timestamp: new Date()
    }]);
    
    if (isActive) {
      speak(message);
    }
  }, [speak, isActive]);

  // Expose respondAsAgent to parent component
  useEffect(() => {
    if (window) {
      (window as any).voiceAgentRespond = respondAsAgent;
    }
  }, [respondAsAgent]);

  // Auto-speak initial prompt
  useEffect(() => {
    if (isActive && prompt && isSupported) {
      setTimeout(() => speak(prompt), 500);
    }
  }, [isActive, prompt, speak, isSupported]);

  if (!isSupported) {
    return (
      <Card className={`${className} border-amber-200 bg-amber-50`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-amber-800">
            <MessageCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Voice features not supported</p>
              <p className="text-sm">Please use a modern browser with speech recognition support.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-primary-200 bg-gradient-to-br from-primary-50 to-pink-50`}>
      <CardContent className="p-6">
        {/* Agent Avatar and Status */}
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
              isSpeaking ? 'bg-primary-500' : 'bg-primary-400'
            }`}
            animate={{
              scale: isSpeaking ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isSpeaking ? Infinity : 0,
            }}
          >
            <Heart className="h-6 w-6 text-white" />
            {isSpeaking && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary-300"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              />
            )}
          </motion.div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Your Relationship Companion</h3>
            <p className="text-sm text-gray-600">
              {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Ready to chat'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={isSpeaking ? "default" : "outline"}
              size="sm"
              onClick={() => isSpeaking ? synthRef.current?.cancel() : speak(currentMessage)}
              disabled={!currentMessage}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <Button
              variant={isListening ? "default" : "outline"}
              size="sm"
              onClick={toggleListening}
              className={isListening ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Current Message */}
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-800">{currentMessage}</p>
        </div>

        {/* Voice Input Display */}
        <AnimatePresence>
          {(isListening || transcript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <p className="text-sm text-blue-600 mb-1">You're saying:</p>
              <p className="text-gray-800">
                {transcript}
                <span className="text-gray-400">{interimTranscript}</span>
                {isListening && <span className="animate-pulse">|</span>}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <p className="text-xs text-gray-500 font-medium">Recent conversation:</p>
            {conversationHistory.slice(-3).map((entry, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  entry.type === 'agent'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <span className="font-medium">
                  {entry.type === 'agent' ? 'Companion' : 'You'}:
                </span>{' '}
                {entry.message}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {isListening 
              ? "Speak naturally - I'm listening!" 
              : "Click the microphone to start talking, or the speaker to hear me again"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 