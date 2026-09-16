// src/services/apiClient.ts
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "http://192.169.3.8/API/api";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    AndroidID: "ANDROID",
  },
});

// ── REQUEST: inject token + userId ──
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token  = await AsyncStorage.getItem("token");
    const userId = await AsyncStorage.getItem("uid");

    if (token)  config.headers["Authorization"] = `Bearer ${token}`;
    if (userId) config.headers["UserID"] = userId;

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Silent re-auth helper ──
const silentReLogin = async (): Promise<string | null> => {
  try {
    const username = await AsyncStorage.getItem("username");
    if (!username) return null;

    const response = await axios.post(`${BASE_URL}/Login/UserLoginMobile`, {
      UserName: username,
      Password: "",
      AndroidID: "ANDROID",
      UserPreferredLanguage: "en",
    });

    const result = response.data?.ResultData;
    if (!result?.Token) return null;

    // Save new token
    await AsyncStorage.multiSet([
      ["token", result.Token],
      ["uid",   String(result.UserID)],
      ["owner_id", String(result.OwnerId ?? "")],
    ]);

    return result.Token;
  } catch {
    return null;
  }
};

// ── RESPONSE: handle errors + auto token refresh ──
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const json = response.data;

    if (json?.Code === "204") return response;

    if (json?.Code === "999" || json?.Code === "888") {
      return Promise.reject(new Error(json.Message || "API Error"));
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const statusCode      = error?.response?.status;
    const json            = error?.response?.data;

    const isUnauthorized =
      statusCode === 401 ||
      json?.Code === "401" ||
      json?.Code === "404" && json?.Message?.toLowerCase().includes("unauthorized");

    // ── Retry once after silent re-login ──
    if (isUnauthorized && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await silentReLogin();

      if (newToken) {
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      // Re-login failed — clear session
      await AsyncStorage.multiRemove(["token", "uid", "owner_id"]);
      return Promise.reject(new Error("Session expired. Please login again."));
    }

    const enhancedError = new Error(json?.Message || error?.message || 'Unexpected error') as any;
    enhancedError.status = statusCode;
    enhancedError.responseData = json;
    return Promise.reject(enhancedError);
  }
);

export default apiClient;