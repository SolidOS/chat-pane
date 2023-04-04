import { store } from 'solid-logic'
import { longChatPane }  from './longChatPane'


export async function createChatThing (chatContainer, me) {
  const created = await longChatPane.mintNew({
    session: {
      store
    }
  },
  {
    me,
    newBase: chatContainer.value
  })
  return created.newInstance
}