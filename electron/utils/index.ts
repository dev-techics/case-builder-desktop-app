import { app } from 'electron';
import path from 'path';

/*-------------------
  Get Database Path
---------------------*/
export const getDatabasePath = () => {
  if (app.isPackaged) {
    return path.join(
      app.getPath('userData'),
      'case-builder',
      'case-builder.db'
    );
  }
  return path.join(process.cwd(), 'storage', 'case-builder.db');
};
