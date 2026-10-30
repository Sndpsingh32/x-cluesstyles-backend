export const createStudioConfigService = ({ studioConfigRepository }) =>
  Object.freeze({
    /**
     * Returns the stored studio configuration, or an empty object when it
     * has never been saved (the storefront then falls back to its defaults).
     */
    getConfig: async () => {
      const config = await studioConfigRepository.getSingleton();
      return config && typeof config === 'object' ? config : {};
    },

    /**
     * Persists the studio configuration (full replace of the singleton).
     */
    saveConfig: async (payload) => {
      const config = payload && typeof payload === 'object' ? payload : {};
      return studioConfigRepository.upsert(config);
    },
  });
