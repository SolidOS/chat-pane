import { store } from 'solid-logic'
import { NamedNode } from 'rdflib'
import { longChatPane }  from './longChatPane'
import { getPodRoot, getMe, determineChatContainer } from './helpers'


export async function findChat (invitee: NamedNode) {
  const me = await getMe()
  const podRoot = await getPodRoot(me)
  const chatContainer = determineChatContainer(invitee, podRoot)
  let exists = true
  try {
    await store.fetcher.load(new NamedNode(chatContainer.value + longChatPane.CHAT_LOCATION_IN_CONTAINER))
  } catch (e) {
    exists = false
  }
  return { me, chatContainer, exists}
}
