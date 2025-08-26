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
  const allAgents = [...availablePersonal, ...availablePresets];
  return allAgents.find(agent => agent.id === id);
}

export const useAgent = create<
  {
    active: Agent[];
    availablePresets: Agent[];
    availablePersonal: Agent[];
    editingAgentId: string | null;
    turnIndex: number;
    speaker: Agent;
    toggleActive: (agentId: string) => void;
    addAgent: (agent: Agent) => void;
    update: (agentId: string, adjustments: Partial<Agent>) => void;
    nextTurn: () => void;
    setEditingAgentId: (agentId: string | null) => void;
  }
>((set, get) => ({
  active: [Paul],
  availablePresets: [Paul, Charlotte, Shane, Penny],
  availablePersonal: personalAgents,
  editingAgentId: null,
  turnIndex: 0,
  speaker: Paul,

  setEditingAgentId: (agentId: string | null) => {
    set({ editingAgentId: agentId });
  },

  toggleActive: (agentId: string) => {
    set(state => {
      const isCurrentlyActive = state.active.some(a => a.id === agentId);
      let newActiveAgents: Agent[];

      if (isCurrentlyActive) {
        // Prevent removing the last agent
        if (state.active.length > 1) {
          newActiveAgents = state.active.filter(a => a.id !== agentId);
        } else {
          newActiveAgents = state.active;
        }
      } else {
        const agentToAdd = getAgentById(agentId);
        if (agentToAdd) {
          newActiveAgents = [...state.active, agentToAdd];
        } else {
          newActiveAgents = state.active;
        }
      }

      const newTurnIndex = Math.min(state.turnIndex, newActiveAgents.length - 1);
      const newSpeaker = newActiveAgents[newTurnIndex];

      return {
        active: newActiveAgents,
        turnIndex: newTurnIndex,
        speaker: newSpeaker,
      };
    });
  },

  addAgent: (agent: Agent) => {
    set(state => {
      const newPersonalAgents = [...state.availablePersonal, agent];
      savePersonalAgents(newPersonalAgents);
      return {
        availablePersonal: newPersonalAgents,
        active: [...state.active, agent],
      };
    });
  },

  nextTurn: () => {
    set(state => {
      const newTurnIndex = (state.turnIndex + 1) % state.active.length;
      const newSpeaker = state.active[newTurnIndex];
      return { turnIndex: newTurnIndex, speaker: newSpeaker };
    });
  },

  update: (agentId: string, adjustments: Partial<Agent>) => {
    const updateAgentInList = (list: Agent[]) =>
      list.map(a => (a.id === agentId ? { ...a, ...adjustments } : a));

    set(state => {
      const newPersonalAgents = updateAgentInList(state.availablePersonal);
      const newActiveAgents = updateAgentInList(state.active);

      if (state.availablePersonal.some(a => a.id === agentId)) {
        savePersonalAgents(newPersonalAgents);
      }

      return {
        availablePersonal: newPersonalAgents,
        active: newActiveAgents,
        speaker:
          state.speaker.id === agentId
            ? newActiveAgents.find(a => a.id === agentId)!
            : state.speaker,
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