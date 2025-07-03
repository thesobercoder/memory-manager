import { ConfigProvider, Layer } from "effect";

interface MockConfigValues {
  [key: string]: string;
}

class MockConfig {
  static withConfig(values: MockConfigValues) {
    const configProvider = ConfigProvider.fromMap(
      new Map(Object.entries(values))
    );

    return Layer.setConfigProvider(configProvider);
  }

  static defaultConfig(): MockConfigValues {
    return {
      OPENMEMORY_BEARER_TOKEN: "test-bearer-token"
    };
  }
}

// Helper to create a test layer with default config
export const defaultConfigLayer = MockConfig.withConfig(MockConfig.defaultConfig());
