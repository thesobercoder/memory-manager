// Test data fixtures for OpenMemory API responses

export const validSuccessResponse = {
  items: [
    {
      id: "test-id-1",
      content: "Test memory content",
      created_at: 1672531200000,
      state: "active",
      app_id: "test-app",
      app_name: "Test App",
      categories: ["work", "important"],
      metadata_: {
        key: "test-key",
        value: "test-value"
      }
    }
  ],
  total: 1,
  page: 1,
  size: 25,
  pages: 1
};

export const malformedResponse = {
  invalid: "missing required fields"
};

export const customPageResponse = {
  items: [],
  total: 0,
  page: 2,
  size: 10,
  pages: 0
};
