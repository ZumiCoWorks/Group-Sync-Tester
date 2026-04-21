'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Participant, Session, Group } from '@/lib/types';
import { generateMockSession, generateMockParticipants } from '@/lib/mock-data';
import { groupStudents } from '@/ai/flows/group-students-flow';

type DemoContextType = {
    session: Session;
    participants: Participant[];
    currentView: 'host' | 'student';
    currentStudentId: string | null;
    addParticipant: (participant: Participant) => void;
    removeParticipant: (id: string) => void;
    addMockParticipants: (count: number) => void;
    shuffleGroups: (groupCount: number, exclusions: { p1Id: string, p2Id: string }[], useDisciplines: boolean) => Promise<void>;
    resetToLobby: () => void;
    setCurrentView: (view: 'host' | 'student') => void;
    setCurrentStudentId: (id: string | null) => void;
    resetDemo: () => void;
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session>(generateMockSession());
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [currentView, setCurrentView] = useState<'host' | 'student'>('host');
    const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

    const addParticipant = (participant: Participant) => {
        setParticipants(prev => [...prev, participant]);
    };

    const removeParticipant = (id: string) => {
        setParticipants(prev => prev.filter(p => p.id !== id));
    };

    const addMockParticipants = (count: number) => {
        const newParticipants = generateMockParticipants(count);
        setParticipants(prev => [...prev, ...newParticipants]);
    };

    const shuffleGroups = async (groupCount: number, exclusions: { p1Id: string, p2Id: string }[], useDisciplines: boolean) => {
        if (participants.length < groupCount) return;

        try {
            const result = await groupStudents({
                participants,
                groupCount,
                exclusions: exclusions.map(e => [e.p1Id, e.p2Id]),
                useDisciplines
            });

            setSession(prev => ({
                ...prev,
                status: 'grouped',
                groups: result.groups
            }));
        } catch (error) {
            // If AI fails (e.g., no API key), fall back to simple random shuffle
            console.warn('AI grouping failed, using random shuffle fallback', error);

            const shuffled = [...participants].sort(() => Math.random() - 0.5);
            const newGroups: { name: string; avatar: string }[][] = Array.from({ length: groupCount }, () => []);

            shuffled.forEach((p, index) => {
                newGroups[index % groupCount].push({ name: p.name, avatar: p.avatar });
            });

            setSession(prev => ({
                ...prev,
                status: 'grouped',
                groups: newGroups
            }));
        }
    };

    const resetToLobby = () => {
        setSession(prev => ({
            ...prev,
            status: 'lobby',
            groups: []
        }));
    };

    const resetDemo = () => {
        setSession(generateMockSession());
        setParticipants([]);
        setCurrentView('host');
        setCurrentStudentId(null);
    };

    return (
        <DemoContext.Provider
            value={{
                session,
                participants,
                currentView,
                currentStudentId,
                addParticipant,
                removeParticipant,
                addMockParticipants,
                shuffleGroups,
                resetToLobby,
                setCurrentView,
                setCurrentStudentId,
                resetDemo
            }}
        >
            {children}
        </DemoContext.Provider>
    );
}

export function useDemoContext() {
    const context = useContext(DemoContext);
    if (context === undefined) {
        throw new Error('useDemoContext must be used within a DemoProvider');
    }
    return context;
}
