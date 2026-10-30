/**
 * StudioConfig repository — owns persistence for the singleton design
 * studio configuration document.
 */
export const createStudioConfigRepository = ({ db }) =>
  Object.freeze({
    getSingleton: ()                       => db.studioConfig.getSingleton(),
    upsert:       (config)                 => db.studioConfig.upsert(config),
  });
