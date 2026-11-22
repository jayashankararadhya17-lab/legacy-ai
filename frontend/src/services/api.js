import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api"
});

export const uploadProject = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/upload/",
    formData
  );

  return response.data;
};

export const scanProject = async (projectId) => {
  const response = await api.post(
    `/analysis/${projectId}/scan`
  );

  return response.data;
};

export const getArchitecture = async (projectId, explanations = {}) => {
  const response = await api.post(`/architecture/${projectId}/analyze`, {
    explanations
  });
  return response.data;
};

export const modernizeProject = async (projectId, targetLanguage, explanations = {}) => {
  const response = await api.post(`/modernization/${projectId}/modernize`, {
    target_language: targetLanguage,
    explanations
  });
  return response.data;
};

export const getSuggestedAnalysisQuestions = async (
  projectId,
  explanations = {},
  architectureSummary = null
) => {
  const response = await api.post(`/analysis/${projectId}/suggested-questions`, {
    explanations,
    architecture_summary: architectureSummary,
  });
  return response.data;
};

export const chatAnalysis = async (projectId, payload) => {
  const response = await api.post(`/analysis/${projectId}/chat`, payload);
  return response.data;
};

export const chatModernization = async (projectId, payload) => {
  const response = await api.post(`/modernization/${projectId}/chat`, payload);
  return response.data;
};

export const explainFile = async (
  projectId,
  filePath
) => {
  const response = await api.post(
    `/analysis/${projectId}/explain`,
    null,
    {
      params: { file_path: filePath }
    }
  );

  return response.data;
};

export default api;