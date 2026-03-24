export {};

declare global {
  interface Window {
    api?: {
      isDesktop?: boolean;
      createBundle: (
        input: { name: string; caseNumber?: string } | string
      ) => Promise<unknown>;
      getBundles: () => Promise<unknown[]>;
      deleteBundle?: (id: string | number) => Promise<void>;
    };
  }
}
