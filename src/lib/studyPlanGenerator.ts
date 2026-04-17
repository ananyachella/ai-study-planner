import type { Subject, TaskInput, TaskType } from '../types';

const PHASE_BREAKPOINTS = {
  foundation: 0.15,
  core: 0.65,
  application: 0.88,
  review: 1.0,
};

type Phase = 'foundation' | 'core' | 'application' | 'review';

interface PhaseTemplate {
  taskType: TaskType;
  titleTemplates: string[];
  descriptionTemplates: string[];
}

const PHASE_TEMPLATES: Record<Phase, PhaseTemplate> = {
  foundation: {
    taskType: 'study',
    titleTemplates: [
      'Introduction & Overview',
      'Foundational Concepts',
      'Core Principles & Theory',
      'Key Terminology & Definitions',
      'Setting Learning Goals',
    ],
    descriptionTemplates: [
      'Begin with a broad overview of the subject. Identify key concepts, gather resources, and set up your study environment.',
      'Study the fundamental principles and foundational theory. Take structured notes using the Cornell method.',
      'Review core terminology and establish a strong conceptual foundation before advancing.',
      'Map out all major topics and subtopics. Create a mind map to visualize connections.',
    ],
  },
  core: {
    taskType: 'study',
    titleTemplates: [
      'Deep Dive - Topic Analysis',
      'Core Concept Mastery',
      'In-Depth Study Session',
      'Concept Exploration',
      'Detailed Learning Block',
      'Critical Concepts Review',
      'Active Reading & Annotation',
      'Lecture & Note-Taking',
    ],
    descriptionTemplates: [
      'Focus on understanding the core mechanisms and theories. Use active recall techniques after each section.',
      'Break down complex concepts into smaller components. Use the Feynman technique to ensure deep understanding.',
      'Study with full concentration. After each topic, summarize key points in your own words without looking at notes.',
      'Work through the material systematically. Create flashcards for important facts and formulas.',
      'Engage deeply with the subject matter. Draw diagrams and visual aids to reinforce understanding.',
    ],
  },
  application: {
    taskType: 'practice',
    titleTemplates: [
      'Practice Problems & Exercises',
      'Applied Learning Session',
      'Problem-Solving Workshop',
      'Real-World Applications',
      'Hands-On Practice',
      'Case Study Analysis',
    ],
    descriptionTemplates: [
      'Apply what you have learned through practice problems. Focus on areas where you feel less confident.',
      'Work through exercises and case studies to reinforce theoretical knowledge with practical application.',
      'Challenge yourself with progressively difficult problems. Review mistakes carefully to understand gaps.',
      'Simulate real-world scenarios and apply your knowledge. This strengthens retention and adaptability.',
    ],
  },
  review: {
    taskType: 'review',
    titleTemplates: [
      'Comprehensive Review',
      'Spaced Repetition Review',
      'Final Revision Session',
      'Key Concepts Summary',
      'Pre-Assessment Review',
    ],
    descriptionTemplates: [
      'Review all major topics covered. Use your notes and flashcards to test your memory without looking at the material.',
      'Go through the entire subject systematically. Pay extra attention to areas where you made errors during practice.',
      'Consolidate all learning. Create a one-page summary sheet of the most critical concepts.',
    ],
  },
};

function getPhase(progress: number): Phase {
  if (progress < PHASE_BREAKPOINTS.foundation) return 'foundation';
  if (progress < PHASE_BREAKPOINTS.core) return 'core';
  if (progress < PHASE_BREAKPOINTS.application) return 'application';
  return 'review';
}

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function generateStudyTasks(subject: Subject): TaskInput[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(subject.deadline);
  deadline.setHours(0, 0, 0, 0);

  const daysAvailable = Math.max(
    1,
    Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  const durationMinutes = Math.round(subject.hours_per_day * 60);
  const tasks: TaskInput[] = [];

  for (let day = 0; day < daysAvailable; day++) {
    const progress = day / Math.max(1, daysAvailable - 1);
    const phase = getPhase(progress);
    const template = PHASE_TEMPLATES[phase];

    const isLastDay = day === daysAvailable - 1;
    const taskType: TaskType = isLastDay ? 'assessment' : template.taskType;

    const titleBase = isLastDay
      ? 'Final Assessment & Self-Test'
      : pickRandom(template.titleTemplates, day + phase.length);

    const description = isLastDay
      ? `Comprehensive self-assessment for ${subject.name}. Test all concepts learned, review your goal: "${subject.goal}", and identify any remaining gaps.`
      : pickRandom(template.descriptionTemplates, day + phase.length + 1);

    const scheduledDate = formatDate(addDays(today, day));
    const dayLabel = day + 1;
    const totalDays = daysAvailable;

    tasks.push({
      title: `${subject.name} - ${titleBase} (Day ${dayLabel}/${totalDays})`,
      description,
      scheduled_date: scheduledDate,
      duration_minutes: durationMinutes,
      task_type: taskType,
    });
  }

  return tasks;
}

export function calculateTotalHours(subject: Subject): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(subject.deadline);
  deadline.setHours(0, 0, 0, 0);

  const daysAvailable = Math.max(
    1,
    Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );

  return Math.round(daysAvailable * subject.hours_per_day * 10) / 10;
}
