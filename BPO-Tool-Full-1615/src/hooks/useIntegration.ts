import { useEffect, useCallback } from 'react';
import { integrationService, IntegrationEventType } from '../services/integrationService';

export function useIntegration(
  moduleName: string,
  eventTypes: IntegrationEventType[],
  handler: (event: any) => void | Promise<void>
) {
  useEffect(() => {
    const unsubscribe = integrationService.subscribeToEvents(
      moduleName,
      eventTypes,
      handler
    );

    return () => {
      unsubscribe();
    };
  }, [moduleName, eventTypes.join(','), handler]);
}

export function useTableSubscription<T = any>(
  tableName: string,
  callback: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; record: T }) => void
) {
  useEffect(() => {
    const unsubscribe = integrationService.subscribeToTable(tableName, callback);

    return () => {
      unsubscribe();
    };
  }, [tableName, callback]);
}

export function usePublishEvent() {
  return useCallback(async (event: Parameters<typeof integrationService.publishEvent>[0]) => {
    await integrationService.publishEvent(event);
  }, []);
}

export { integrationService };
