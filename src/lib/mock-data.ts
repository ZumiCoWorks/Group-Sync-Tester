import { Participant, Session, Group } from './types';

const MOCK_NAMES = [
    'Alex Johnson', 'Sam Chen', 'Jordan Smith', 'Taylor Brown', 'Morgan Davis',
    'Casey Wilson', 'Riley Martinez', 'Avery Anderson', 'Quinn Taylor', 'Sage Moore',
    'River Jackson', 'Skylar White', 'Dakota Harris', 'Phoenix Lee', 'Rowan Clark',
    'Finley Lewis', 'Emerson Walker', 'Harper Hall', 'Kendall Young', 'Reese King'
];

const MOCK_AVATARS = ['⚡', '💎', '🔥', '🪐', '🧬', '💻', '🎓', '⚖️', '🏹', '🛡️', '🧪', '🔭', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎺', '🎻'];

const MOCK_DISCIPLINES = [
    'Start-Up Finance',
    'Marketing and Sales',
    'U(I)X Operations and Design',
    'Business Strategy & Management'
];

export function generateMockParticipants(count: number): Participant[] {
    const participants: Participant[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < Math.min(count, MOCK_NAMES.length); i++) {
        let name = MOCK_NAMES[i];
        let counter = 1;

        // Ensure unique names
        while (usedNames.has(name)) {
            name = `${MOCK_NAMES[i]} ${counter}`;
            counter++;
        }
        usedNames.add(name);

        participants.push({
            id: `demo-participant-${i}`,
            name,
            avatar: MOCK_AVATARS[i % MOCK_AVATARS.length],
            joinedAt: Date.now() - (count - i) * 1000,
            discipline: i % 3 === 0 ? MOCK_DISCIPLINES[i % MOCK_DISCIPLINES.length] : ''
        });
    }

    return participants;
}

export function generateMockSession(): Session {
    return {
        hostId: 'demo-host',
        status: 'lobby',
        createdAt: Date.now(),
        groups: []
    };
}

export function getDemoSessionId(): string {
    return 'DEMO';
}
