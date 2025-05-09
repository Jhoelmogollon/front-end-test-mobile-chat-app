import { useDatabaseStatus } from '../../database/DatabaseProvider';

export function useDatabase() {
  return useDatabaseStatus();
} 