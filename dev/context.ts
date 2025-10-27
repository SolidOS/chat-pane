import { DataBrowserContext, PaneRegistry } from 'pane-registry'
import { solidLogicSingleton, store } from 'solid-logic'
import { longChatPane } from '../src/longChatPane'
import { LiveStore } from 'rdflib'

export const context: DataBrowserContext = {
  session: {
    store: store as LiveStore,
    paneRegistry: {
      byName: (name: string) => {
        return longChatPane
      }
    } as PaneRegistry,
    logic: solidLogicSingleton
  },
  dom: document,
  getOutliner: () => null,
};

export const fetcher = store.fetcher;
