/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef } from 'react';
import { Modality } from '@google/genai';

import BasicFace from '../basic-face/BasicFace';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { createSystemInstructions } from '@/lib/prompts';
import { useAgent, useUser } from '@/lib/state';

export default function KeynoteCompanion() {
  const { setConfig } = useLiveAPIContext();
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const user = useUser();
  const { speaker, active } = useAgent();

  // Set the configuration for the Live API
  useEffect(() => {
    const otherAgents = active.filter(a => a.id !== speaker.id);
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: speaker.voice },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: createSystemInstructions(speaker, user, otherAgents),
          },
        ],
      },
    });
  }, [setConfig, user, speaker, active]);

  return (
    <div className="keynote-companion">
      <BasicFace canvasRef={faceCanvasRef!} color={speaker.bodyColor} />
    </div>
  );
}