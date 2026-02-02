'use server';
/**
 * @fileOverview A student grouping AI agent.
 *
 * - groupStudents - A function that handles the student grouping process based on constraints.
 * - GroupStudentsInput - The input type for the groupStudents function.
 * - GroupStudentsOutput - The return type for the groupStudents function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  joinedAt: z.number(),
  discipline: z.string().optional(),
});

const GroupSchema = z.object({
  name: z.string(),
  avatar: z.string(),
});

export const GroupStudentsInputSchema = z.object({
  participants: z.array(ParticipantSchema).describe('The list of all participants to be grouped.'),
  groupCount: z.number().describe('The exact number of groups to create.'),
  useDisciplines: z.boolean().describe('Whether to balance groups by discipline.'),
  exclusions: z.array(z.tuple([z.string(), z.string()])).describe('Pairs of participant IDs that should not be in the same group.'),
});
export type GroupStudentsInput = z.infer<typeof GroupStudentsInputSchema>;

export const GroupStudentsOutputSchema = z.object({
  groups: z.array(z.array(GroupSchema)).describe('The generated groups of students.'),
});
export type GroupStudentsOutput = z.infer<typeof GroupStudentsOutputSchema>;

const DISCIPLINES = ['Start-Up Finance', 'Marketing and Sales', 'U(I)X Operations and Design', 'Business Strategy & Management'];

export async function groupStudents(input: GroupStudentsInput): Promise<GroupStudentsOutput> {
  return groupStudentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'groupStudentsPrompt',
  input: { schema: GroupStudentsInputSchema },
  output: { schema: GroupStudentsOutputSchema },
  prompt: `You are an expert at organizing students into groups for a classroom activity. You will be given a list of participants, the number of groups to create, and a set of rules to follow.

Your task is to create {{groupCount}} groups from the list of participants.

Here is the list of all participants:
{{#each participants}}
- Name: {{name}}, ID: {{id}}, Avatar: {{avatar}}{{#if discipline}}, Discipline: {{discipline}}{{/if}}
{{/each}}

You must follow these rules:
1.  Create exactly {{groupCount}} groups.
2.  Distribute the participants as evenly as possible across the groups.
3.  Exclusion Rule: The following pairs of students (by ID) MUST NOT be in the same group:
    {{#if exclusions}}
        {{#each exclusions}}
        - {{this.[0]}} and {{this.[1]}}
        {{/each}}
    {{else}}
    (No exclusion rules)
    {{/if}}
4.  Discipline Rule: {{#if useDisciplines}}You MUST try to balance the groups by discipline. The available disciplines are: ${DISCIPLINES.join(
    ', '
  )}. Ideally, each group should have one representative from each discipline where possible. Spread the experts out.{{else}}The discipline of the students can be ignored.{{/if}}

Your response MUST be ONLY the JSON object matching the output schema. The JSON should contain a "groups" key, where the value is an array of groups. Each group is an array of student objects, containing only their "name" and "avatar" from the original participant list.`,
});

const groupStudentsFlow = ai.defineFlow(
  {
    name: 'groupStudentsFlow',
    inputSchema: GroupStudentsInputSchema,
    outputSchema: GroupStudentsOutputSchema,
  },
  async (input) => {
    // The model can sometimes fail to follow instructions perfectly.
    // As a fallback, if the AI fails, we'll use a random shuffle.
    try {
      const { output } = await prompt(input);

      // Basic validation: ensure the correct number of groups was created.
      if (output?.groups.length === input.groupCount) {
        return output;
      } else {
        console.warn('AI did not return the correct number of groups. Falling back to random shuffle.');
        // Fallthrough to random shuffle
      }
    } catch (e) {
      console.error('AI grouping failed, falling back to random shuffle.', e);
      // Fallthrough to random shuffle
    }

    // Fallback to random shuffle
    const shuffled = [...input.participants].sort(() => Math.random() - 0.5);
    const newGroups: { name: string; avatar: string }[][] = Array.from({ length: input.groupCount }, () => []);

    shuffled.forEach((p, index) => {
      newGroups[index % input.groupCount].push({ name: p.name, avatar: p.avatar });
    });

    return { groups: newGroups };
  }
);
