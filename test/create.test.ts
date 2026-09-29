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
  store: {
    any: vi.fn(),
    fetcher: {
      load: vi.fn(),
      webOperation: vi.fn()
    },
    updater: {
      update: vi.fn()
    }
  },
  widgets: {
    newThing: vi.fn()
  },
  longChatPane: {
    mintNew: vi.fn(),
    CHAT_LOCATION_IN_CONTAINER: 'index.ttl#this'
  }
}))

vi.mock('solid-ui', () => ({
  ns: {
    rdf: makeNamespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#'),
    space: makeNamespace('http://www.w3.org/ns/pim/space#'),
    ldp: makeNamespace('http://www.w3.org/ns/ldp#'),
    solid: makeNamespace('http://www.w3.org/ns/solid/terms#'),
    meeting: makeNamespace('http://www.w3.org/ns/pim/meeting#'),
    dc: makeNamespace('http://purl.org/dc/elements/1.1/'),
    foaf: makeNamespace('http://xmlns.com/foaf/0.1/'),
    wf: makeNamespace('http://www.w3.org/2005/01/wf/flow#')
  },
  widgets: mocks.widgets
}))

vi.mock('solid-logic', () => ({
  authn: mocks.authn,
  store: mocks.store
}))

vi.mock('../src/longChatPane', () => ({
  longChatPane: mocks.longChatPane
}))

import { getChat } from '../src/create'

describe('create.ts', () => {
  const me = sym('https://example.com/profile/card#me')
  const invitee = sym('https://example.com/profile/alice#me')
  const podRoot = sym('https://example.com/storage/')
  const chatContainer = new NamedNode('https://example.com/storage/IndividualChats/example.com/')
  const chatThing = new NamedNode(`${chatContainer.value}index.ttl#this`)
  const inviteeInbox = makeTerm('https://example.com/profile/alice/inbox/')
  const privateTypeIndex = makeTerm('https://example.com/settings/privateTypeIndex.ttl')
  const reg = makeTerm('https://example.com/settings/privateTypeIndex.ttl#reg')
  const chatAclDoc = makeTerm(`${chatContainer.value}.acl`)
  const aclLink = makeTerm('http://www.iana.org/assignments/link-relations/acl')

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.authn.currentUser.mockReturnValue(me)
    mocks.widgets.newThing.mockReturnValue(reg)
    mocks.longChatPane.mintNew.mockResolvedValue({ newInstance: chatThing })
    mocks.store.updater.update.mockImplementation((_del: unknown, _ins: unknown, cb: Function) => {
      const savedUri = 'uri'
      cb(savedUri, true, '')
    })
    mocks.store.fetcher.webOperation.mockReset()
    mocks.store.fetcher.load.mockReset()
    mocks.store.any.mockReset()
  })

  it('finds an existing chat document without creating a new one', async () => {
    const existingChat = new NamedNode(`${chatContainer.value}index.ttl#this`)

    mocks.store.fetcher.load.mockImplementation(async (node: NamedNode) => {
      if (node.uri === me.doc().uri) return {}
      if (node.uri === existingChat.uri) return {}
      return {}
    })
    mocks.store.any.mockImplementation((subject: any, predicate: any) => {
      if (subject?.uri === me.uri && predicate?.uri === makeNamespace('http://www.w3.org/ns/pim/space#')('storage').uri) {
        return podRoot
      }
      return null
    })

    const result = await getChat(invitee)

    expect(result.value).toBe(existingChat.value)
    expect(mocks.longChatPane.mintNew).not.toHaveBeenCalled()
    expect(mocks.store.fetcher.webOperation).not.toHaveBeenCalled()
  })

  it('creates a new chat, sends an invite, sets ACL, and updates the private type index', async () => {
    const existingChat = new NamedNode(`${chatContainer.value}index.ttl#this`)

    mocks.store.fetcher.load.mockImplementation(async (node: NamedNode) => {
      if (node.uri === me.doc().uri) return {}
      if (node.uri === invitee.doc().uri) return {}
      if (node.uri === chatContainer.value) return {}
      if (node.uri === privateTypeIndex.uri) return {}
      if (node.uri === existingChat.uri) {
        throw new Error('404 Not Found')
      }
      return {}
    })
    mocks.store.any.mockImplementation((subject: any, predicate: any) => {
      const predicateUri = predicate?.uri
      if (subject?.uri === me.uri && predicateUri === makeNamespace('http://www.w3.org/ns/pim/space#')('storage').uri) {
        return podRoot
      }
      if (subject?.uri === invitee.uri && predicateUri === makeNamespace('http://www.w3.org/ns/ldp#')('inbox').uri) {
        return inviteeInbox
      }
      if (subject?.uri === chatContainer.value && predicateUri === aclLink.uri) {
        return chatAclDoc
      }
      if (subject?.uri === me.uri && predicateUri === makeNamespace('http://www.w3.org/ns/solid/terms#')('privateTypeIndex').uri) {
        return privateTypeIndex
      }
      return null
    })
    mocks.store.fetcher.webOperation
      .mockResolvedValueOnce({
        headers: {
          get: (name: string) => (name === 'location' ? chatThing.value : null)
        },
        status: 201
      })
      .mockResolvedValueOnce({
        headers: {
          get: () => null
        },
        status: 200
      })

    const result = await getChat(invitee)

    expect(result.value).toBe(chatThing.value)
    expect(mocks.longChatPane.mintNew).toHaveBeenCalledWith(
      { session: { store: mocks.store } },
      { me, newBase: chatContainer.value }
    )
    expect(mocks.store.fetcher.webOperation).toHaveBeenCalledTimes(2)
    expect(mocks.store.updater.update).toHaveBeenCalledTimes(1)
    expect(mocks.widgets.newThing).toHaveBeenCalledWith(privateTypeIndex)
  })
})
