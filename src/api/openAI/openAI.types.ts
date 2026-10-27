// src/api/openAI/openAI.types.ts
// New endpoint — not present in the Java app, which called api.openai.com directly with a
// hardcoded key. This backend endpoint needs to be added server-side: it should hold the
// OpenAI (or equivalent) API key and forward the question, returning the assistant's reply.
export interface GetAIAnswerRequest {
  Question: string;
}

export interface GetAIAnswer {
  ResultData?: GetAIAnswerResultData;
  Message?: string;
  Code?: string;
}

export interface GetAIAnswerResultData {
  Answer?: string;
}
