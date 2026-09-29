import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NamedNode, sym } from 'rdflib'

type Term = {
  uri: string
  value: string
  doc: () => Term
}

function makeTerm (uri: string): Term {
  return {
    uri,
    value: uri,
    doc: () => makeTerm(uri.includes('#') ? uri.slice(0, uri.indexOf('#')) : uri)
  }
}

function makeNamespace (base: string) {
  return (suffix: string) => makeTerm(base + suffix)
}

const mocks = vi.hoisted(() => ({
  authn: {
    currentUser: vi.fn()
  },
  ui: {
    ns: {
      rdf: makeNamespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
      space: makeNamespace('http://www.w3.org/ns/pim/space#'),
      ldp: makeNamespace('http://www.w3.org/ns/ldp#'),
      solid: makeNamespace('http://www.w3.org/ns/solid/terms#'),
      meeting: makeNamespace('http://www.w3.org/ns/pim/meeting#'),
      dc: makeNamespace('http://purl.org/dc/elements/1.1/'),
      dct: makeNamespace('http://purl.org/dc/terms/'),
      foaf: makeNamespace('http://xmlns.com/foaf/0.1/'),
      wf: makeNamespace('http://www.w3.org/2005/01/wf/flow#'),
      sioc: makeNamespace('http://rdfs.org/sioc/ns#')
    },
    icons: { iconBase: '' },
    style: { sidebarComponentStyle: '', sidebarStyle: '' },
    widgets: {},
    login: { registrationControl: vi.fn(), registrationList: vi.fn() },
    preferences: { renderPreferencesForm: vi.fn(), getPreferencesForClass: vi.fn() },
    messageArea: vi.fn(),
    pad: { manageParticipation: vi.fn() },
    create: { newThingUI: vi.fn() }
  }
}))

vi.mock('solid-logic', () => ({
  authn: mocks.authn
}))

vi.mock('solid-ui', () => mocks.ui)

import { longChatPane } from '../src/longChatPane'

describe('longChatPane.mintNew', () => {
  const me = sym('https://example.com/profile/card#me')
  const newBase = 'https://example.com/chat/'
  const newInstance = new NamedNode(`${newBase}index.ttl#this`)
  const newChatDoc = newInstance.doc()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the chat graph and writes ACLs for owner and public/invitee access', async () => {
    const add = vi.fn()
    const statementsMatching = vi.fn(() => [])
    const updater = {
      put: vi.fn((_doc: NamedNode, _statements: unknown[], _contentType: string, callback: Function) => {
        const savedUri = 'uri'
        callback(savedUri, true, '')
        return Promise.resolve()
      })
    }
    const fetcher = {
      webOperation: vi.fn()
    }
    const store = {
      sym,
      add,
      statementsMatching,
      fetcher,
      updater
    }

    fetcher.webOperation
      .mockResolvedValueOnce({
        headers: { get: () => null },
        status: 200
      })
      .mockResolvedValueOnce({
        headers: { get: () => null },
        status: 200
      })

    const result = await longChatPane.mintNew(
      { session: { store } } as any,
      { me, newBase } as any
    ) as { newInstance: NamedNode }

    expect(result.newInstance.value).toBe(newInstance.value)
    expect(add).toHaveBeenCalledWith(
      newInstance,
      expect.objectContaining({ uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' }),
      expect.objectContaining({ uri: 'http://www.w3.org/ns/pim/meeting#LongChat' }),
      newChatDoc
    )
    expect(add).toHaveBeenCalledWith(
      newInstance,
      expect.objectContaining({ uri: 'http://purl.org/dc/elements/1.1/title' }),
      'Chat channel',
      newChatDoc
    )
    expect(add).toHaveBeenCalledWith(
      newInstance,
      expect.objectContaining({ uri: 'http://purl.org/dc/elements/1.1/created' }),
      expect.any(Date),
      newChatDoc
    )
    expect(add).toHaveBeenCalledWith(
      newInstance,
      expect.objectContaining({ uri: 'http://purl.org/dc/elements/1.1/author' }),
      me,
      newChatDoc
    )
    expect(updater.put).toHaveBeenCalledWith(newChatDoc, [], 'text/turtle', expect.any(Function))
    expect(fetcher.webOperation).toHaveBeenCalledTimes(2)
    expect(fetcher.webOperation).toHaveBeenNthCalledWith(
      1,
      'PUT',
      `${newBase}.acl`,
      expect.objectContaining({
        contentType: 'text/turtle',
        data: expect.stringContaining('acl:AuthenticatedAgent')
      })
    )
    expect(fetcher.webOperation).toHaveBeenNthCalledWith(
      2,
      'PUT',
      `${newBase}index.ttl.acl`,
      expect.objectContaining({
        contentType: 'text/turtle',
        data: expect.stringContaining('acl:Write')
      })
    )
  })
})
