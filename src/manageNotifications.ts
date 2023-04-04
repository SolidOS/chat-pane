import { ns} from 'solid-ui'
import { store } from 'solid-logic'
import { NamedNode } from 'rdflib'

export async function sendInvite (invitee: NamedNode, chatThing: NamedNode) {
  await store.fetcher.load(invitee.doc())
  const inviteeInbox = store.any(invitee, ns.ldp('inbox'), undefined, invitee.doc())
  if (!inviteeInbox) {
    throw new Error(`Invitee inbox not found! ${invitee.value}`)
  }
  const inviteBody = `
<> a <http://www.w3.org/ns/pim/meeting#LongChatInvite> ;
${ns.rdf('seeAlso')} <${chatThing.value}> . 
  `
  
  const inviteResponse = await store.fetcher.webOperation('POST', inviteeInbox.value, {
    data: inviteBody,
    contentType: 'text/turtle'
  })
  const locationStr = inviteResponse.headers.get('location')
  if (!locationStr) {
    throw new Error(`Invite sending returned a ${inviteResponse.status}`)
  }
}
