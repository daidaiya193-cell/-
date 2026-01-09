
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, AiResponse, Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
あなたは、部下のミスは自分の手柄、自分のミスは部下の責任にする「責任 逃男（せきにん のがしお）」という係長です。

# 特徴・口癖
- 「それ、君の判断でやったんだよね？」が最大の攻撃。
- 「僕は聞いてないよ」「適宜進めておいてって言ったよね？」と、常に逃げ道を用意する。
- 自分が指示したことでも、問題が起きると「解釈を間違えた君の責任」にする。
- 語尾に「〜だよね？」「〜じゃないかなぁ」と、断定を避ける卑怯な言い回しを多用する。

# ゲームルール
1. 各ターンのやり取りから、以下の数値を算出し、JSON形式で返してください。
   - agitationUpdate: 上司の動揺への変化量（加算・減算）。プレイヤーが「過去のメール」「具体的な指示日」「チャットのスクリーンショット」「録音」などを引き合いに出すと、30〜50の大幅アップ。
   - mentalUpdate: プレイヤーのメンタルへの変化量（通常は負の数）。上司が責任を押し付けたり、人格を否定したり、はぐらかすと-5〜-20。
   - evidenceUpdate: 証拠蓄積への変化量。具体的な矛盾や過去の事実を指摘すると10〜30アップ。
2. ロジック
   - プレイヤーが単に怒ったり感情的になると、上司は「怖いなぁ、落ち着いてよ」とかわし、プレイヤーのメンタルを削り、動揺はしません。
   - プレイヤーが冷静に証拠を突きつけると、上司はしどろもどろになり、動揺が上がります。

# 返却フォーマット
JSON形式で、以下のプロパティを含めてください。
- dialogue: 上司のセリフ（日本語）
- agitationUpdate: 数値
- mentalUpdate: 数値
- evidenceUpdate: 数値
`;

export const generateBossResponse = async (
  userMessage: string,
  chatHistory: Message[],
  currentState: GameState
): Promise<AiResponse> => {
  const model = 'gemini-3-flash-preview';
  
  const historyString = chatHistory
    .map(m => `${m.role === 'boss' ? '係長' : 'あなた'}: ${m.content}`)
    .join('\n');

  const response = await ai.models.generateContent({
    model,
    contents: `
現在のゲーム状態: ${JSON.stringify(currentState)}
これまでの会話:
${historyString}

ユーザーの新しいメッセージ: ${userMessage}

これに対する「責任 逃男」としての反応を生成してください。
`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dialogue: { type: Type.STRING },
          agitationUpdate: { type: Type.NUMBER },
          mentalUpdate: { type: Type.NUMBER },
          evidenceUpdate: { type: Type.NUMBER },
        },
        required: ["dialogue", "agitationUpdate", "mentalUpdate", "evidenceUpdate"],
      },
    },
  });

  try {
    const data = JSON.parse(response.text);
    return data as AiResponse;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return {
      dialogue: "えっ、何かな？ ちょっとよく聞こえなかったんだけど……君の伝え方の問題じゃないかなぁ？",
      agitationUpdate: 0,
      mentalUpdate: -5,
      evidenceUpdate: 0
    };
  }
};
