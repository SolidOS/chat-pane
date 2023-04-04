import { ns } from 'solid-ui'
import { authn, store } from 'solid-logic'
import { NamedNode } from 'rdflib'

export async function getMe () {
  const me = authn.currentUser()
  if (me === null) {
    throw new Error('Current user not found! Not logged in?')
  }
  await store.fetcher.load(me.doc())
  return me
}

export async function getPodRoot (me): Promise<NamedNode> {
  const podRoot = store.any(me, ns.space('storage'), undefined, me.doc())
  if (!podRoot) {
    throw new Error('Current user pod root not found!')
  }
  return podRoot as NamedNode
}

export function determineChatContainer (invitee, podRoot) {
  // Create chat
  // See https://gitter.im/solid/chat-app?at=5f3c800f855be416a23ae74a
  const chatContainerStr = new URL(`IndividualChats/${new URL(invitee.value).host}/`, podRoot.value).toString()
  return new NamedNode(chatContainerStr)
}
