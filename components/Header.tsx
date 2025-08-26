/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { createNewAgent } from '@/lib/presets/agents';
import { useAgent, useUI, useUser } from '@/lib/state';
import c from 'classnames';
import { useEffect, useState } from 'react';

export default function Header() {
  const { showUserConfig, setShowUserConfig, setShowAgentEdit } = useUI();
  const { name } = useUser();
  const {
    active,
    toggleActive,
    availablePresets,
    availablePersonal,
    addAgent,
    setEditingAgentId,
  } = useAgent();
  const { disconnect } = useLiveAPIContext();

  const [showRoomList, setShowRoomList] = useState(false);

  useEffect(() => {
    const close = () => setShowRoomList(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  function handleAgentSelection(agentId: string) {
    disconnect();
    toggleActive(agentId);
  }

  function addNewChatterBot() {
    disconnect();

    const defaultAgentRegex = /^New ChatterBot #(\d+)$/;
    let maxNum = 0;
    availablePersonal.forEach(agent => {
      const match = agent.name.match(defaultAgentRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });

    const newAgent = createNewAgent({
      name: `New ChatterBot #${maxNum + 1}`,
    });

    addAgent(newAgent);
    setEditingAgentId(newAgent.id);
    setShowAgentEdit(true);
  }

  return (
    <header>
      <div className="roomInfo">
        <div className="roomName">
          <button
            onClick={e => {
              e.stopPropagation();
              setShowRoomList(!showRoomList);
            }}
          >
            <h1 className={c({ active: showRoomList })}>
              <span>{active.map(a => a.name).join(', ')}</span>
              <span className="icon">arrow_drop_down</span>
            </h1>
          </button>
          <div className="active-agents-controls">
            {active.map(agent => (
              <button
                key={agent.id}
                title={`Edit ${agent.name}`}
                className="button edit-agent-button"
                onClick={() => {
                  setEditingAgentId(agent.id);
                  setShowAgentEdit(true);
                }}
              >
                <span className="icon">edit</span>
              </button>
            ))}
          </div>
        </div>

        <div className={c('roomList', { active: showRoomList })}>
          <div>
            <h3>Presets</h3>
            <ul>
              {availablePresets.map(agent => (
                <li
                  key={agent.id}
                  className={c({
                    active: active.some(a => a.id === agent.id),
                  })}
                >
                  <button onClick={() => handleAgentSelection(agent.id)}>
                    {agent.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Your ChatterBots</h3>
            {
              <ul>
                {availablePersonal.length ? (
                  availablePersonal.map(agent => (
                    <li
                      key={agent.id}
                      className={c({
                        active: active.some(a => a.id === agent.id),
                      })}
                    >
                      <button onClick={() => handleAgentSelection(agent.id)}>
                        {agent.name}
                      </button>
                    </li>
                  ))
                ) : (
                  <p>None yet.</p>
                )}
              </ul>
            }
            <button
              className="newRoomButton"
              onClick={() => {
                addNewChatterBot();
              }}
            >
              <span className="icon">add</span>New ChatterBot
            </button>
          </div>
        </div>
      </div>
      <button
        className="userSettingsButton"
        onClick={() => setShowUserConfig(!showUserConfig)}
      >
        <p className="user-name">{name || 'Your name'}</p>
        <span className="icon">tune</span>
      </button>
    </header>
  );
}