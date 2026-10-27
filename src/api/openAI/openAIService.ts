// src/api/openAI/openAIService.ts
// Source: FieldWeb/OpenAI/OpenAIFragment.java + Retrofit/ApiClientForOpenAI.java
// The Java app called api.openai.com directly with a hardcoded API key. Here we instead call
// our own backend, which should hold the key server-side and proxy the request — see openAI.types.ts.
import apiClient from '../apiClient';
import type { GetAIAnswer, GetAIAnswerRequest } from './openAI.types';

/**
 * Endpoint: POST OpenAI/GetAnswer
 * Backend contract to be implemented server-side: accepts { Question }, calls the AI
 * provider with the server-held key, returns { ResultData: { Answer }, Message, Code }.
 */
export const getAIAnswer = async (data: GetAIAnswerRequest): Promise<GetAIAnswer> => {
  const response = await apiClient.post('OpenAI/GetAnswer', data);
  return response.data;
};
