import { useState, useCallback } from 'react';
import { SkillData } from '@/data/wblData';

export function useSkillData() {
  const [skillData, setSkillData] = useState<Map<string, SkillData>>(new Map());

  const toggleSkill = useCallback((skillId: string) => {
    setSkillData(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(skillId);
      
      if (existing) {
        newMap.set(skillId, { ...existing, completed: !existing.completed, updated_at: new Date().toISOString() });
      } else {
        newMap.set(skillId, {
          skill_id: skillId,
          selected_tools: '',
          task_mapping: '',
          teaching_strategy: '',
          monitoring_approach: '',
          notes: '',
          completed: true,
          updated_at: new Date().toISOString()
        });
      }
      return newMap;
    });
  }, []);

  const toggleTool = useCallback((skillId: string, tool: string) => {
    setSkillData(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(skillId);
      if (!data) return prev;
      
      let tools = data.selected_tools ? data.selected_tools.split(',').filter(t => t) : [];
      
      if (tools.includes(tool)) {
        tools = tools.filter(t => t !== tool);
      } else {
        tools.push(tool);
      }
      
      newMap.set(skillId, { ...data, selected_tools: tools.join(','), updated_at: new Date().toISOString() });
      return newMap;
    });
  }, []);

  const saveTaskMapping = useCallback((skillId: string, value: string) => {
    setSkillData(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(skillId);
      if (!data) return prev;
      
      newMap.set(skillId, { ...data, task_mapping: value, updated_at: new Date().toISOString() });
      return newMap;
    });
  }, []);

  const toggleStrategy = useCallback((skillId: string, strategy: string) => {
    setSkillData(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(skillId);
      if (!data) return prev;
      
      let strategies = data.teaching_strategy ? data.teaching_strategy.split(',').filter(s => s) : [];
      
      if (strategies.includes(strategy)) {
        strategies = strategies.filter(s => s !== strategy);
      } else {
        strategies.push(strategy);
      }
      
      newMap.set(skillId, { ...data, teaching_strategy: strategies.join(','), updated_at: new Date().toISOString() });
      return newMap;
    });
  }, []);

  const toggleMonitoring = useCallback((skillId: string, approach: string) => {
    setSkillData(prev => {
      const newMap = new Map(prev);
      const data = newMap.get(skillId);
      if (!data) return prev;
      
      let approaches = data.monitoring_approach ? data.monitoring_approach.split(',').filter(a => a) : [];
      
      if (approaches.includes(approach)) {
        approaches = approaches.filter(a => a !== approach);
      } else {
        approaches.push(approach);
      }
      
      newMap.set(skillId, { ...data, monitoring_approach: approaches.join(','), updated_at: new Date().toISOString() });
      return newMap;
    });
  }, []);

  const getSelectedSkillIds = useCallback(() => {
    return Array.from(skillData.entries())
      .filter(([_, data]) => data.completed)
      .map(([id]) => id);
  }, [skillData]);

  const getCompletedCount = useCallback(() => {
    return Array.from(skillData.values()).filter(s => s.completed).length;
  }, [skillData]);

  return {
    skillData,
    toggleSkill,
    toggleTool,
    saveTaskMapping,
    toggleStrategy,
    toggleMonitoring,
    getSelectedSkillIds,
    getCompletedCount
  };
}
