
export interface GameState {
  agitation: number; // 上司の動揺 (0-100)
  mental: number;    // プレイヤーのメンタル (0-100)
  evidence: number;  // 証拠蓄積 (0-100)
}

export interface Message {
  role: 'boss' | 'player' | 'system';
  content: string;
  timestamp: Date;
}

export interface AiResponse {
  dialogue: string;
  agitationUpdate: number;
  mentalUpdate: number;
  evidenceUpdate: number;
  isComplianceTriggered?: boolean;
}
