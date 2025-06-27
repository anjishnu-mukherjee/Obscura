export interface Victim {
    name: string;
    profession: string;
    lastKnownLocation: string;
    deathTimeEstimate: string;
    causeOfDeath: string;
    portrait: string;
}

export interface Suspect {
    name: string;
    role: string;
    alibi: string;
    motives: string[];
    isKiller: boolean;
    personality: string;
    cluesTriggers?: ClueWithTrigger[];
    portrait: string;
}

export interface TimelineEvent {
    time: string;
    event: string;
}

export interface Witness {
    name: string;
    role: string;
    background: string;
    testimony: string;
    reliability: string;
    hiddenAgenda: string;
    cluesTriggers?: ClueWithTrigger[];
}

export interface StoryStructure {
    title: string;
    setting: string;
    victim: Victim;
    suspects: Suspect[];
    killer: string;
    locations: string[];
    clues: Record<string, string[]>;
    witnesses: Record<string, Witness[]>;
    timeline: TimelineEvent[];
}

export interface DisplayData {
    victimName: string;
    lastKnownLocation: string;
    causeOfDeath: string;
    initialSuspects: string[];
    mainLocation: string;
}

export interface CaseIntro {
    introNarrative: string;
    journalEntry: string;
    displayData: DisplayData;
}

export interface LocationNode {
    id: string;
    fullName: string;
    connections: string[];
}

export interface MapStructure {
    nodes: LocationNode[];
    mermaidDiagram: string;
}

export type ClueType = 'Physical Object' | 'Digital Record' | 'Biological Trace' | 'Witness Testimony' | 'Environmental Anomaly';
export type ClueCategory = 'direct' | 'indirect' | 'red_herring';
export type DiscoveryRequirement = 'forensic_kit' | 'hack' | 'deep_search' | 'witness_help' | 'riddle' | 'special_item' | 'observation';

export interface ProcessedClue {
    type: ClueType;
    content: string;
    discovery: {
        requires: DiscoveryRequirement;
        difficulty: number;
        requiresItem?: string;
        requiresAction?: string;
        requiresWitnessHelp?: string;
    };
    category: ClueCategory;
    relatedSuspects?: string[];
    timeRelevance?: string;
    locationContext?: string;
}

export interface ProcessedClues {
    [location: string]: ProcessedClue[];
}

export interface ClueWithTrigger {
    clue: string;
    triggerType: 'pressing' | 'gentle' | 'aggressive' | 'sympathetic' | 'specific_question';
    triggerLevel: 1 | 2 | 3 | 4 | 5;
    triggerDescription: string;
    isRedHerring: boolean;
    importance: 'critical' | 'important' | 'minor';
    revealed: boolean;
}

export interface NotepadEntry {
    id: string;
    caseId: string;
    content: string;
    createdAt: any;
    updatedAt: any;
    page: number;
}

export interface InvestigationFinding {
    id: string;
    source: 'interrogation' | 'location_visit' | 'clue_discovery';
    sourceDetails: string;
    finding: string;
    importance: 'critical' | 'important' | 'minor';
    timestamp: any;
    isNew: boolean;
}

export interface InterrogationRecord {
    interrogatedAt: any;
    lastInterrogationDate: string;
    sessions: InterrogationSession[];
}

export interface InterrogationSession {
    sessionId: string;
    timestamp: any;
    questions: InterrogationQA[];
    fullTranscript: string;
    audioId?: string;
    findings?: string[];
    cluesRevealed?: string[];
}

export interface InterrogationQA {
    question: string;
    response: string;
    timestamp: any;
}
