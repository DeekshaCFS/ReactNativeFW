// src/api/countryDetails/countryDetailsService.ts
// Auto-generated from URLConstant.java (CountryDetails endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see countryDetails.types.ts
import apiClient from '../apiClient';
import type { GetCountryList, GetCountryListResultData, GetCountrySymbol, GetCountrySymbolResultData } from './countryDetails.types';

/**
 * Source: URLConstant.CountryList.GET_COUNTRY_LIST
 * Endpoint: GET CountryDetails/GetCountryList
 */
export const getCountryList = async (params?: Record<string, any>): Promise<GetCountryList> => {
  const response = await apiClient.get('CountryDetails/GetCountryList', { params });
  return response.data;
};

/**
 * Source: URLConstant.CountryList.GET_COUNTRY_SYMBOL
 * Endpoint: GET CountryDetails/GetCountryExtensionCodeByUserId
 */
export const getCountrySymbol = async (params?: Record<string, any>): Promise<GetCountrySymbol> => {
  const response = await apiClient.get('CountryDetails/GetCountryExtensionCodeByUserId', { params });
  return response.data;
};
