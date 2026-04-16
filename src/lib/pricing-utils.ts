import { generateTimeSlots } from "@/components/courts-list";

export const DAYS_MAP = [
  { id: 0, label: "D" },
  { id: 1, label: "L" },
  { id: 2, label: "M" },
  { id: 3, label: "X" },
  { id: 4, label: "J" },
  { id: 5, label: "V" },
  { id: 6, label: "S" },
];

export interface PricingRule {
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  price: number;
  priority: number;
}

/**
 * Converts a list of rules into a matrix for the grid UI.
 * Higher priority rules win for each slot.
 */
export function rulesToGrid(
  rules: PricingRule[], 
  basePrice: number, 
  timeSlots: string[]
): Record<string, { price: number; priority: number; ruleId?: number }> {
  const grid: Record<string, { price: number; priority: number }> = {};

  // Initialize with base price
  for (let d = 0; d < 7; d++) {
    for (const time of timeSlots) {
      grid[`${d}-${time}`] = { price: basePrice, priority: 0 };
    }
  }

  // Apply rules sorted by priority ASC so later rules override
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    const rulePrice = Number(rule.price);
    const rulePriority = Number(rule.priority);
    for (const day of rule.daysOfWeek) {
      for (const time of timeSlots) {
        // Option A: Rule covers START of slot
        if (time >= rule.startTime && time < rule.endTime) {
          grid[`${day}-${time}`] = { price: rulePrice, priority: rulePriority };
        }
      }
    }
  }

  return grid;
}

/**
 * Converts grid data back into a minimal set of rules.
 * Merges adjacent slots with the same price and priority.
 */
export function gridToRules(
  grid: Record<string, { price: number; priority: number }>,
  basePrice: number,
  timeSlots: string[]
): PricingRule[] {
  const rules: PricingRule[] = [];
  
  // 1. Group by Price + Priority combinations (excluding base price)
  const priceGroups: Record<string, Array<{ day: number; time: string }>> = {};

  const bPrice = Number(basePrice);

  for (const [key, data] of Object.entries(grid)) {
    const cellPrice = Number(data.price);
    if (cellPrice === bPrice) continue;
    
    const cellPriority = Number(data.priority);
    const keyGroup = `${cellPrice}-${cellPriority}`;
    if (!priceGroups[keyGroup]) priceGroups[keyGroup] = [];
    
    const [day, time] = key.split("-");
    priceGroups[keyGroup].push({ day: parseInt(day), time });
  }

  // 2. For each price group, find contiguous time ranges per day
  for (const [groupKey, cells] of Object.entries(priceGroups)) {
    const [price, priority] = groupKey.split("-").map(Number);
    
    // Per day blocks
    const dayBlocks: Record<number, Array<{ start: string; end: string }>> = {};
    
    for (let d = 0; d < 7; d++) {
      const dayCells = cells.filter(c => c.day === d).map(c => c.time).sort();
      if (dayCells.length === 0) continue;

      let currentRange: { start: string; end: string } | null = null;
      
      for (let i = 0; i < timeSlots.length; i++) {
        const time = timeSlots[i];
        const isPresent = dayCells.includes(time);
        
        if (isPresent) {
          if (!currentRange) {
            currentRange = { start: time, end: getNextSlot(time, timeSlots) };
          } else {
            currentRange.end = getNextSlot(time, timeSlots);
          }
        } else {
          if (currentRange) {
            if (!dayBlocks[d]) dayBlocks[d] = [];
            dayBlocks[d].push(currentRange);
            currentRange = null;
          }
        }
      }
      if (currentRange) {
        if (!dayBlocks[d]) dayBlocks[d] = [];
        dayBlocks[d].push(currentRange);
      }
    }

    // 3. Merge identical time ranges across different days
    const mergedRules: Array<{ start: string; end: string; days: number[] }> = [];

    for (const [dayStr, blocks] of Object.entries(dayBlocks)) {
      const d = parseInt(dayStr);
      for (const block of blocks) {
        const existing = mergedRules.find(r => r.start === block.start && r.end === block.end);
        if (existing) {
          existing.days.push(d);
        } else {
          mergedRules.push({ ...block, days: [d] });
        }
      }
    }

    // 4. Create final rules
    for (const r of mergedRules) {
      rules.push({
        startTime: r.start,
        endTime: r.end,
        daysOfWeek: r.days.sort(),
        price,
        priority
      });
    }
  }

  return rules;
}

function getNextSlot(time: string, timeSlots: string[]): string {
  const idx = timeSlots.indexOf(time);
  if (idx === -1 || idx === timeSlots.length - 1) {
    // Return +30m manually if it's the last slot
    const [h, m] = time.split(":").map(Number);
    let nh = h, nm = m + 30;
    if (nm >= 60) { nh++; nm = 0; }
    return `${nh.toString().padStart(2, "0")}:${nm.toString().padStart(2, "0")}`;
  }
  return timeSlots[idx + 1];
}
