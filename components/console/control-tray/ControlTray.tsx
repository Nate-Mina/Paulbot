/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from 'classnames';

import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from '../../../lib/audio-recorder';

import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { useAgent, useUI } from '@/lib/state';

export type ControlTrayProps = {
  children?: ReactNode;
};

function ControlTray({ children }: ControlTrayProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const isUserTurn = useRef(true);

  const { showAgentEdit, showUserConfig } = useUI();
  const {
    client,
    connected,
    connect,
    disconnect,
    latestText,
    resetLatestText,
  } = useLiveAPIContext();
  const { active, nextTurn, turnIndex } = useAgent();

  // Stop the current agent if the user is editing the agent or user config
  useEffect(() => {
    if (showAgentEdit || showUserConfig) {
      if (connected) disconnect();
    }
  }, [showUserConfig, showAgentEdit, connected, disconnect]);

  useEffect(() => {
    // Fix: Corrected typo from `connectButton` to `connectButtonRef`.
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // Main conversation loop
  useEffect(() => {
    // We only trigger the loop if there's a new text response from an agent
    // and it's not the user's turn to speak.
    if (!connected || !latestText || isUserTurn.current) {
      return;
    }

    const currentResponse = latestText;
    resetLatestText(); // Prevent this effect from re-firing for the same text

    // It's now the next agent's turn.
    nextTurn();
    const nextTurnIndex = (turnIndex + 1) % active.length;

    // Check if we've completed a full round of agent responses.
    if (nextTurnIndex === 0) {
      // The round is complete, so it's the user's turn again.
      isUserTurn.current = true;
      // We need to re-connect to apply the config for the first agent
      // in preparation for the user speaking.
      (async () => {
        await disconnect();
        await connect();
      })();
    } else {
      // Pass the conversation to the next agent in the queue.
      (async () => {
        await disconnect(); // Disconnect to change agent config.
        await connect(); // Reconnect applies new config from KeynoteCompanion.
        // Send the previous agent's response as the prompt for the next agent.
        client.send({ text: currentResponse }, true);
      })();
    }
  }, [
    latestText,
    connected,
    client,
    disconnect,
    connect,
    nextTurn,
    active.length,
    turnIndex,
    resetLatestText,
  ]);

  useEffect(() => {
    const onData = (base64: string) => {
      // Only send user's audio if it's their turn
      if (isUserTurn.current && connected) {
        client.sendRealtimeInput([
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64,
          },
        ]);
        // Once the user starts speaking, it's no longer their "turn" to initiate.
        // The system will respond, and then it becomes the next agent's turn.
        isUserTurn.current = false;
      }
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on('data', onData);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off('data', onData);
    };
  }, [connected, client, muted, audioRecorder]);

  const handleConnectClick = async () => {
    if (connected) {
      await disconnect();
    } else {
      isUserTurn.current = false;
      resetLatestText();
      await connect();
      // Start the conversation with a greeting
      client.send(
        {
          text: 'Greet the user and introduce yourself and your role.',
        },
        true
      );
    }
  };

  return (
    <section className="control-tray">
      <nav className={cn('actions-nav', { disabled: !connected })}>
        <button
          className={cn('action-button mic-button')}
          onClick={() => setMuted(!muted)}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>
        {children}
      </nav>

      <div className={cn('connection-container', { connected })}>
        <div className="connection-button-container">
          <button
            ref={connectButtonRef}
            className={cn('action-button connect-toggle', { connected })}
            onClick={handleConnectClick}
          >
            <span className="material-symbols-outlined filled">
              {connected ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
        <span className="text-indicator">Streaming</span>
      </div>
    </section>
  );
}

export default memo(ControlTray);