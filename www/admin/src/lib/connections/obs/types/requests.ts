import type { Kinds } from "./input-kinds";
import type { SceneItem, SceneItemTransform } from "./scene-item";

type SceneResponse = { sceneIndex: number; sceneName: string; sceneUuid: string };
type SceneIdentifier = { sceneName: string } | { sceneUuid: string };
type InputIdentifier = { inputName: string } | { inputUuid: string };
type SourceIdentifier = { sourceName: string } | { sourceUuid: string };

export type CreateInputOptions<K extends keyof Kinds = keyof Kinds> = {
  inputName: string;
  inputKind: K;
  inputSettings?: Partial<Kinds[K]["settings"]>;
  sceneItemEnabled?: boolean;
};

type Requests = {
  GetStats: {
    options: undefined;
    response: {
      cpuUsage: number;
      memoryUsage: number;
      availableDiskSpace: number;
      activeFps: number;
      averageFrameRenderTime: number;
      renderSkippedFrames: number;
      renderTotalFrames: number;
      outputSkippedFrames: number;
      outputTotalFrames: number;
      webSocketSessionIncomingMessages: number;
      webSocketSessionOutgoingMessages: number;
    };
  };
  GetInputKindList: {
    options: { unversioned?: boolean };
    response: { inputKinds: string[] };
  };
  CreateInput: {
    options: SceneIdentifier & CreateInputOptions;
    response: { inputUuid: string; sceneItemId: number };
  };
  GetInputSettings: {
    options: InputIdentifier;
    response: { inputKind: string; inputSettings: any };
  };
  SetInputName: {
    options: InputIdentifier & { newInputName: string };
    response: unknown;
  };
  SetInputSettings: {
    options: InputIdentifier & { inputSettings: any; overlay?: boolean };
    response: unknown;
  };
  RemoveInput: {
    options: InputIdentifier;
    response: unknown;
  };
  GetInputDefaultSettings: {
    options: { inputKind: string };
    response: { defaultInputSettings: any };
  };
  OpenInputPropertiesDialog: {
    options: InputIdentifier;
    response: unknown;
  };
  CreateScene: {
    options: { sceneName: string };
    response: { sceneUuid: string };
  };
  GetSceneList: {
    options: undefined;
    response: {
      currentProgramSceneName: string | null;
      currentProgramSceneUuid: string | null;
      currentPreviewSceneName: string | null;
      currentPreviewSceneUuid: string | null;
      scenes: SceneResponse[];
    };
  };
  SetSceneName: {
    options: SceneIdentifier & { newSceneName: string };
    response: unknown;
  };
  GetSceneItemList: {
    options: SceneIdentifier;
    response: { sceneItems: SceneItem[] };
  };
  SetSceneItemTransform: {
    options: SceneIdentifier & {
      sceneItemId: number;
      sceneItemTransform: Partial<SceneItemTransform>;
    };
    response: unknown;
  };
  SetSceneItemIndex: {
    options: SceneIdentifier & {
      sceneItemId: number;
      sceneItemIndex: number;
    };
    response: unknown;
  };
  RemoveSceneItem: {
    options: SceneIdentifier & { sceneItemId: number };
    response: unknown;
  };
  PressInputPropertiesButton: {
    options: InputIdentifier & { propertyName: string };
    response: unknown;
  };
  GetSourceScreenshot: {
    options: SourceIdentifier & {
      imageFormat: string;
      imageWidth?: number;
      imageHeight?: number;
      imageCompressionQuality?: number;
    };
    response: { imageData: string };
  };
  CallVendorRequest: {
    options: {
      vendorName: string;
      requestType: string;
      requestData?: any;
    };
    response: unknown;
  };
};

export type RequestTypes = keyof Requests;
export type RequestTypeOptions<K extends keyof Requests> = Requests[K]["options"];
export type RequestTypeResponses<K extends keyof Requests> = Requests[K]["response"];
