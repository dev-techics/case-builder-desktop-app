export {};

declare global {
  interface Window {
    api?: {
      isDesktop?: boolean;
      createBundle: (
        input:
          | {
              name: string;
              caseNumber?: string;
              status?: string;
              description?: string;
              tags?: string[];
            }
          | string
      ) => Promise<unknown>;
      getBundles: () => Promise<unknown[]>;
      deleteBundle?: (id: string | number) => Promise<void>;
    };
  }
}
