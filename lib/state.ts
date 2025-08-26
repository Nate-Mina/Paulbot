/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import { Agent, Charlotte, Paul, Shane, Penny } from './presets/agents';

/**
 * User
 */
export type User = {
  name?: string;
  info?: string;
};

export const useUser = create<
  {
    setName: (name: string) => void;
    setInfo: (info: string) => void;
  } & User
>(set => ({
  name: '',
  info: '',
  setName: name => set({ name }),
  setInfo: info => set({ info }),
}));

/**
 * Agents
 */
const LOCAL_STORAGE_KEY = 'chatterbots-personal-agents';

function loadPersonalAgents(): Agent[] {
  try {
    const savedAgents = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedAgents) {
      return JSON.parse(savedAgents);
    }
  } catch (error) {
    console.error('Failed to load personal agents from localStorage', error);
  }
  return [];
}

function savePersonalAgents(agents: Agent[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(agents));
  } catch (error) {
    console.error('Failed to save personal agents to localStorage', error);
  }
}

const personalAgents = loadPersonalAgents();

function getAgentById(id: string) {
  const { availablePersonal, availablePresets } = useAgent.getState();
  return (
    availablePersonal.find(agent => agent.id === id) ||
    availablePresets.find(agent => agent.id === id)
  );
}

export const useAgent = create<{
  current: Agent;
  availablePresets: Agent[];
  availablePersonal: Agent[];
  setCurrent: (agent: Agent | string) => void;
  addAgent: (agent: Agent) => void;
  update: (agentId: string, adjustments: Partial<Agent>) => void;
}>(set => ({
  current: Paul,
  availablePresets: [Paul, Charlotte, Shane, Penny],
  availablePersonal: personalAgents,

  addAgent: (agent: Agent) => {
    set(state => {
      const newPersonalAgents = [...state.availablePersonal, agent];
      savePersonalAgents(newPersonalAgents);
      return {
        availablePersonal: newPersonalAgents,
        current: agent,
      };
    });
  },
  setCurrent: (agent: Agent | string) =>
    set({ current: typeof agent === 'string' ? getAgentById(agent) : agent }),
  update: (agentId: string, adjustments: Partial<Agent>) => {
    set(state => {
      const agentToUpdate =
        state.availablePersonal.find(a => a.id === agentId) ||
        state.availablePresets.find(a => a.id === agentId);

      if (!agentToUpdate) {
        return state;
      }

      const updatedAgent = { ...agentToUpdate, ...adjustments };

      const wasPersonal = state.availablePersonal.some(a => a.id === agentId);
      const newPersonalAgents = state.availablePersonal.map(a =>
        a.id === agentId ? updatedAgent : a
      );

      if (wasPersonal) {
        savePersonalAgents(newPersonalAgents);
      }

      return {
        current: state.current.id === agentId ? updatedAgent : state.current,
        availablePresets: state.availablePresets.map(a =>
          a.id === agentId ? updatedAgent : a
        ),
        availablePersonal: newPersonalAgents,
      };
    });
  },
}));

/**
 * UI
 */
export const useUI = create<{
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
}>(set => ({
  showUserConfig: personalAgents.length === 0,
  setShowUserConfig: (show: boolean) => set({ showUserConfig: show }),
  showAgentEdit: false,
  setShowAgentEdit: (show: boolean) => set({ showAgentEdit: show }),
}));
