'use client';

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { SERVICE_CATALOG } from '@/lib/crm/constants';
import { computeDashboardMetrics } from '@/lib/crm/metrics';
import { mockClients } from '@/lib/crm/mock-data';
import {
  CrmClient,
  IntakeFormValues,
  TimelineEntry,
  UploadAssetInput,
} from '@/lib/crm/types';

type UpdateWorkflowInput = {
  workStatus?: CrmClient['service']['workStatus'];
  paymentStatus?: CrmClient['service']['paymentStatus'];
  paidAmount?: number;
  note?: string;
};

type CrmClientsContextValue = {
  clients: CrmClient[];
  metrics: ReturnType<typeof computeDashboardMetrics>;
  isHydrated: boolean;
  refresh: () => void;
  createClient: (payload: IntakeFormValues) => CrmClient;
  uploadAssets: (clientId: string, assets: UploadAssetInput[]) => CrmClient | undefined;
  updateWorkflow: (clientId: string, patch: UpdateWorkflowInput) => CrmClient | undefined;
  resetToMock: () => CrmClient[];
};

const CrmClientsContext = createContext<CrmClientsContextValue | null>(null);

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const randomId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

const createTimelineEntry = (
  clientId: string,
  title: string,
  description: string,
  tone: TimelineEntry['tone'],
): TimelineEntry => ({
  id: randomId('tl'),
  clientId,
  title,
  description,
  timestamp: new Date().toISOString(),
  tone,
});

const getInitialClients = () => clone(mockClients);

export function CrmClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<CrmClient[]>(() => getInitialClients());

  const refresh = useCallback(() => {
    setClients((current) => [...current]);
  }, []);

  const createClient = useCallback(
    (payload: IntakeFormValues) => {
      const now = new Date().toISOString();
      const serviceType = 'general_form';
      const basePrice =
        SERVICE_CATALOG.find((service) => service.id === serviceType)?.basePrice ?? 1800;

      const created: CrmClient = {
        id: randomId('cl'),
        name: payload.name.trim(),
        gmail: payload.gmail.trim(),
        contactNumber: payload.contactNumber.trim(),
        source: 'website_chat',
        notes: 'New lead captured from the frontend intake flow.',
        createdAt: now,
        lastUpdatedAt: now,
        service: {
          type: serviceType,
          fee: basePrice,
          workStatus: 'pending',
          paymentStatus: 'unpaid',
          paidAmount: 0,
          startedAt: now,
        },
        assets: [],
        timeline: [
          {
            id: randomId('tl'),
            clientId: '',
            title: 'Client created from intake flow',
            description: 'Basic profile details captured successfully.',
            timestamp: now,
            tone: 'info',
          },
        ],
      };

      created.timeline = created.timeline.map((entry) => ({
        ...entry,
        clientId: created.id,
      }));

      setClients((current) => [created, ...current]);
      return created;
    },
    [],
  );

  const uploadAssets = useCallback(
    (clientId: string, assets: UploadAssetInput[]) => {
      if (assets.length === 0) {
        return clients.find((client) => client.id === clientId);
      }

      let updatedClient: CrmClient | undefined;

      setClients((current) => {
        const index = current.findIndex((client) => client.id === clientId);
        if (index === -1) return current;

        const now = new Date().toISOString();
        const mappedAssets = assets.map((asset) => ({
          id: randomId('asset'),
          clientId,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
          kind: asset.kind,
          previewUrl: asset.previewUrl,
          uploadedAt: now,
        }));

        updatedClient = {
          ...current[index],
          lastUpdatedAt: now,
          assets: [...mappedAssets, ...current[index].assets],
          timeline: [
            createTimelineEntry(
              clientId,
              'Documents uploaded from intake flow',
              `${mappedAssets.length} file(s) attached to this client preview.`,
              'success',
            ),
            ...current[index].timeline,
          ],
        };

        const next = [...current];
        next[index] = updatedClient;
        return next;
      });

      return updatedClient;
    },
    [clients],
  );

  const updateWorkflow = useCallback(
    (clientId: string, patch: UpdateWorkflowInput) => {
      let updatedClient: CrmClient | undefined;

      setClients((current) => {
        const index = current.findIndex((client) => client.id === clientId);
        if (index === -1) return current;

        const existing = current[index];
        const now = new Date().toISOString();
        const nextService = {
          ...existing.service,
          ...(patch.workStatus ? { workStatus: patch.workStatus } : {}),
          ...(patch.paymentStatus ? { paymentStatus: patch.paymentStatus } : {}),
          ...(typeof patch.paidAmount === 'number'
            ? { paidAmount: Math.max(0, Math.floor(patch.paidAmount)) }
            : {}),
          ...(patch.workStatus === 'completed' && !existing.service.completedAt
            ? { completedAt: now }
            : {}),
        };

        updatedClient = {
          ...existing,
          service: nextService,
          lastUpdatedAt: now,
          timeline: [
            createTimelineEntry(
              clientId,
              'Workflow updated',
              patch.note ??
                `Status changed to ${nextService.workStatus}, payment is ${nextService.paymentStatus}.`,
              patch.workStatus === 'completed'
                ? 'success'
                : patch.paymentStatus === 'unpaid'
                  ? 'warning'
                  : 'info',
            ),
            ...existing.timeline,
          ],
        };

        const next = [...current];
        next[index] = updatedClient;
        return next;
      });

      return updatedClient;
    },
    [],
  );

  const resetToMock = useCallback(() => {
    const reset = getInitialClients();
    setClients(reset);
    return reset;
  }, []);

  const metrics = useMemo(() => computeDashboardMetrics(clients), [clients]);

  const value = useMemo<CrmClientsContextValue>(
    () => ({
      clients,
      metrics,
      isHydrated: true,
      refresh,
      createClient,
      uploadAssets,
      updateWorkflow,
      resetToMock,
    }),
    [clients, createClient, metrics, refresh, resetToMock, updateWorkflow, uploadAssets],
  );

  return createElement(CrmClientsContext.Provider, { value }, children);
}

export function useCrmClients() {
  const context = useContext(CrmClientsContext);

  if (!context) {
    throw new Error('useCrmClients must be used within CrmClientsProvider');
  }

  return context;
}

