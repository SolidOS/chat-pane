import { NamedNode } from 'rdflib'
import { longChatPane }  from './longChatPane'
import { sendInvite } from './manageNotifications'
import { setAcl, addToPrivateTypeIndex } from './manageChat'
import { findChat } from './findChat'
import { createChatThing } from './createChat'


export async function getChat (invitee: NamedNode, createIfMissing = true): Promise<NamedNode> {
  const { me, chatContainer, exists } = await findChat (invitee)
  if (exists) {
    return new NamedNode(chatContainer.value + longChatPane.CHAT_LOCATION_IN_CONTAINER)
  }

  if (createIfMissing) {
    const chatThing = await createChatThing(chatContainer, me)
    await sendInvite(invitee, chatThing)
    await setAcl(chatContainer, me, invitee)
    await addToPrivateTypeIndex(chatThing, me)
    return chatThing
  }
 
}
