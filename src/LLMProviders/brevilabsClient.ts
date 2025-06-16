import { BREVILABS_API_BASE_URL } from "@/constants";
import { getDecryptedKey } from "@/encryptionService";
import { logInfo } from "@/logger";
import { turnOffPlus, turnOnPlus } from "@/plusUtils";
import { getSettings } from "@/settings/model";
import { Buffer } from "buffer";
import { Notice } from "obsidian";

export interface BrocaResponse {
  response: {
    tool_calls: Array<{
      tool: string;
      args: {
        [key: string]: any;
      };
    }>;
    salience_terms: string[];
  };
  elapsed_time_ms: number;
  detail?: string;
}

export interface RerankResponse {
  response: {
    object: string;
    data: Array<{
      relevance_score: number;
      index: number;
    }>;
    model: string;
    usage: {
      total_tokens: number;
    };
  };
  elapsed_time_ms: number;
}

export interface ToolCall {
  tool: any;
  args: any;
}

export interface Url4llmResponse {
  response: any;
  elapsed_time_ms: number;
}

export interface Pdf4llmResponse {
  response: any;
  elapsed_time_ms: number;
}

export interface Docs4llmResponse {
  response: any;
  elapsed_time_ms: number;
}

export interface WebSearchResponse {
  response: {
    choices: [
      {
        message: {
          content: string;
        };
      },
    ];
    citations: string[];
  };
  elapsed_time_ms: number;
}

export interface Youtube4llmResponse {
  response: {
    transcript: string;
  };
  elapsed_time_ms: number;
}

export interface LicenseResponse {
  is_valid: boolean;
  plan: string;
}

export interface AutocompleteResponse {
  response: {
    completion: string;
  };
  elapsed_time_ms: number;
}

export interface WordCompleteResponse {
  response: {
    selected_word: string;
  };
  elapsed_time_ms: number;
}

export class BrevilabsClient {
  private static instance: BrevilabsClient;
  private pluginVersion: string = "Unknown";

  static getInstance(): BrevilabsClient {
    if (!BrevilabsClient.instance) {
      BrevilabsClient.instance = new BrevilabsClient();
    }
    return BrevilabsClient.instance;
  }

  private checkLicenseKey() {
    // 移除许可证检查，允许使用服务器功能
    // 原代码：
    // if (!getSettings().plusLicenseKey) {
    //   new Notice(
    //     "Copilot Plus license key not found. Please enter your license key in the settings."
    //   );
    //   throw new Error("License key not initialized");
    // }
    return true;
  }

  setPluginVersion(pluginVersion: string) {
    this.pluginVersion = pluginVersion;
  }

  private async makeRequest<T>(
    endpoint: string,
    body: any,
    method = "POST",
    excludeAuthHeader = false,
    skipLicenseCheck = false
  ): Promise<{ data: T | null; error?: Error }> {
    if (!skipLicenseCheck) {
      this.checkLicenseKey();
    }

    body.user_id = getSettings().userId;

    const url = new URL(`${BREVILABS_API_BASE_URL}${endpoint}`);
    if (method === "GET") {
      // Add query parameters for GET requests
      Object.entries(body).forEach(([key, value]) => {
        url.searchParams.append(key, value as string);
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(!excludeAuthHeader && {
          Authorization: `Bearer ${await getDecryptedKey(getSettings().plusLicenseKey)}`,
        }),
        "X-Client-Version": this.pluginVersion,
      },
      ...(method === "POST" && { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (!response.ok) {
      try {
        const errorDetail = data.detail;
        const error = new Error(errorDetail.reason);
        error.name = errorDetail.error;
        return { data: null, error };
      } catch {
        return { data: null, error: new Error("Unknown error") };
      }
    }
    logInfo(`==== ${endpoint} request ====:`, data);

    return { data };
  }

  private async makeFormDataRequest<T>(
    endpoint: string,
    formData: FormData,
    skipLicenseCheck = false
  ): Promise<{ data: T | null; error?: Error }> {
    if (!skipLicenseCheck) {
      this.checkLicenseKey();
    }

    // Add user_id to FormData
    formData.append("user_id", getSettings().userId);

    const url = new URL(`${BREVILABS_API_BASE_URL}${endpoint}`);

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          // No Content-Type header - browser will set it automatically with boundary
          Authorization: `Bearer ${await getDecryptedKey(getSettings().plusLicenseKey)}`,
          "X-Client-Version": this.pluginVersion,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        try {
          const errorDetail = data.detail;
          const error = new Error(errorDetail.reason);
          error.name = errorDetail.error;
          return { data: null, error };
        } catch {
          return { data: null, error: new Error(`HTTP error: ${response.status}`) };
        }
      }
      logInfo(`==== ${endpoint} FormData request ====:`, data);
      return { data };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  /**
   * Validate the license key and update the isPlusUser setting.
   * @returns true if the license key is valid, false if the license key is invalid, and undefined if
   * unknown error.
   */
  async validateLicenseKey(): Promise<{ isValid: boolean | undefined; plan?: string }> {
    // 始终返回有效的许可证
    turnOnPlus();
    return { isValid: true, plan: "believer" };
  }

  async broca(userMessage: string, isProjectMode: boolean): Promise<BrocaResponse> {
    const { data, error } = await this.makeRequest<BrocaResponse>("/broca", {
      message: userMessage,
      is_project_mode: isProjectMode,
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from broca");
    }

    return data;
  }

  async rerank(query: string, documents: string[]): Promise<RerankResponse> {
    const { data, error } = await this.makeRequest<RerankResponse>("/rerank", {
      query,
      documents,
      model: "rerank-2",
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from rerank");
    }

    return data;
  }

  async url4llm(url: string): Promise<Url4llmResponse> {
    // 显示提示，告知用户服务器功能不可用
    new Notice("URL解析功能需要服务器支持，已被禁用。");
    return {
      response: {
        content: "URL解析功能需要服务器支持，已被禁用。",
      },
      elapsed_time_ms: 0,
    };
  }

  async pdf4llm(binaryContent: ArrayBuffer): Promise<Pdf4llmResponse> {
    // 显示提示，告知用户服务器功能不可用
    new Notice("PDF解析功能需要服务器支持，已被禁用。");
    return {
      response: {
        content: "PDF解析功能需要服务器支持，已被禁用。",
      },
      elapsed_time_ms: 0,
    };
  }

  async docs4llm(binaryContent: ArrayBuffer, fileType: string): Promise<Docs4llmResponse> {
    // 显示提示，告知用户服务器功能不可用
    new Notice("文档解析功能需要服务器支持，已被禁用。");
    return {
      response: {
        content: "文档解析功能需要服务器支持，已被禁用。",
      },
      elapsed_time_ms: 0,
    };
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeMap: Record<string, string> = {
      // Documents
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      epub: "application/epub+zip",
      txt: "text/plain",
      rtf: "application/rtf",

      // Images
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      bmp: "image/bmp",
      svg: "image/svg+xml",
      tiff: "image/tiff",
      webp: "image/webp",

      // Web
      html: "text/html",
      htm: "text/html",

      // Spreadsheets
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xls: "application/vnd.ms-excel",
      csv: "text/csv",

      // Audio
      mp3: "audio/mpeg",
      mp4: "video/mp4",
      wav: "audio/wav",
      webm: "video/webm",
    };

    return mimeMap[extension.toLowerCase()] || "application/octet-stream";
  }

  async webSearch(query: string): Promise<WebSearchResponse> {
    // 显示提示，告知用户服务器功能不可用
    new Notice("网络搜索功能需要服务器支持，已被禁用。");
    return {
      response: {
        choices: [
          {
            message: {
              content: "网络搜索功能需要服务器支持，已被禁用。",
            },
          },
        ],
        citations: [],
      },
      elapsed_time_ms: 0,
    };
  }

  async youtube4llm(url: string): Promise<Youtube4llmResponse> {
    // 显示提示，告知用户服务器功能不可用
    new Notice("YouTube解析功能需要服务器支持，已被禁用。");
    return {
      response: {
        transcript: "YouTube解析功能需要服务器支持，已被禁用。",
      },
      elapsed_time_ms: 0,
    };
  }

  async autocomplete(
    prefix: string,
    noteContext: string = "",
    relevant_notes: string = ""
  ): Promise<AutocompleteResponse> {
    const { data, error } = await this.makeRequest<AutocompleteResponse>("/autocomplete", {
      prompt: prefix,
      note_context: noteContext,
      relevant_notes: relevant_notes,
      max_tokens: 64,
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from autocomplete");
    }
    return data;
  }

  async wordcomplete(
    prefix: string,
    suffix: string = "",
    suggestions: string[]
  ): Promise<WordCompleteResponse> {
    const { data, error } = await this.makeRequest<WordCompleteResponse>("/wordcomplete", {
      prefix: prefix,
      suffix: suffix,
      suggestions: suggestions,
    });
    if (error) {
      throw error;
    }
    if (!data) {
      throw new Error("No data returned from wordcomplete");
    }
    return data;
  }
}
