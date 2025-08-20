import { useCallback, useEffect, useRef } from 'react';
import type { GameAction, GameState } from '../types/game';

interface WebRTCGameProps {
  onGameStateChange: (gameState: GameState) => void;
  onAction: (action: GameAction) => void;
  isHost: boolean;
}

export const useWebRTCMultiplayer = ({ onGameStateChange, onAction, isHost }: WebRTCGameProps) => {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const localOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  const initializePeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real app, you'd send this to the other peer via signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'gameState') {
            onGameStateChange(data.payload);
          } else if (data.type === 'action') {
            onAction(data.payload);
          }
        } catch (error) {
          console.error('Error parsing WebRTC message:', error);
        }
      };
    };

    if (isHost) {
      const channel = pc.createDataChannel('game');
      channel.onopen = () => {
        console.log('Data channel opened (host)');
      };
      dataChannel.current = channel;
    }

    peerConnection.current = pc;
  }, [isHost, onGameStateChange, onAction]);

  const sendGameState = useCallback((gameState: GameState) => {
    if (dataChannel.current && dataChannel.current.readyState === 'open') {
      dataChannel.current.send(JSON.stringify({
        type: 'gameState',
        payload: gameState
      }));
    }
  }, []);

  const sendAction = useCallback((action: GameAction) => {
    if (dataChannel.current && dataChannel.current.readyState === 'open') {
      dataChannel.current.send(JSON.stringify({
        type: 'action',
        payload: action
      }));
    }
  }, []);

  const createOffer = useCallback(async () => {
    if (!peerConnection.current) return null;

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      localOfferRef.current = offer;
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      return null;
    }
  }, []);

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return null;

    try {
      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      return null;
    }
  }, []);

  const acceptAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;

    try {
      await peerConnection.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  }, []);

  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnection.current) return;

    try {
      await peerConnection.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  }, []);

  useEffect(() => {
    initializePeerConnection();
    
    return () => {
      disconnect();
    };
  }, [initializePeerConnection, disconnect]);

  return {
    sendGameState,
    sendAction,
    createOffer,
    createAnswer,
    acceptAnswer,
    addIceCandidate,
    disconnect,
    isConnected: dataChannel.current?.readyState === 'open'
  };
};