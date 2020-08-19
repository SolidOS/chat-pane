import { authn, store, ns, widgets } from 'solid-ui'
import { NamedNode, st } from 'rdflib'
import longChatPane from './longChatPane'

async function getMe () {
  const me = authn.currentUser()
  if (me === null) {
    throw new Error('Current user not found! Not logged in?')
  }
  await store.fetcher.load(me.doc())
  return me
}

async function getPodRoot (me): Promise<NamedNode> {
  const podRoot = store.any(me, ns.space('storage'), undefined, me.doc())
  if (!podRoot) {
    throw new Error('Current user pod root not found!')
  }
  return podRoot
}

async function sendInvite (invitee: NamedNode, chatThing: NamedNode) {
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
  console.log("webOperation response", inviteResponse)
  const locationStr = inviteResponse.headers.get('location')
  if (locationStr) {
    console.log('Invite sent', new URL(locationStr, inviteeInbox.value).toString())
  } else {
    console.log('Invite sending returned', inviteResponse.status)
  }

}

function createChatLocation (invitee, podRoot) {
  // Create chat
  // See https://gitter.im/solid/chat-app?at=5f3c800f855be416a23ae74a
  const chatLocationStr = new URL(`IndividualChats/${new URL(invitee.value).host}/`, podRoot.value).toString()
  return new NamedNode(chatLocationStr)
}

async function createChatThing (chatLocation, me) {
  const created = await longChatPane.mintNew({
    session: {
      store
    }
  },
  {
    me,
    newBase: chatLocation.value
  })
  return created.newInstance
}

async function setAcl(chatLocation, me, invitee) {
  console.log('Finding ACL for', chatLocation)
  await store.fetcher.load(chatLocation)
  // FIXME: check the Why value on this quad:
  const chatAclDoc = store.any(chatLocation, new NamedNode('http://www.iana.org/assignments/link-relations/acl'))
  if (!chatAclDoc) {
    window.alert('Chat ACL doc not found!')
    return
  }
  console.log('Setting ACl', chatLocation, chatAclDoc)
  const aclBody = `
@prefix acl: <http://www.w3.org/ns/auth/acl#>.
<#owner>
a acl:Authorization;
acl:agent <${me.value}>;
acl:accessTo <.>;
acl:default <.>;
acl:mode
acl:Read, acl:Write, acl:Control.
<#invitee>
a acl:Authorization;
acl:agent <${invitee.value}>;
acl:accessTo <.>;
acl:default <.>;
acl:mode
acl:Append.
`
  const aclResponse = await store.fetcher.webOperation('PUT', chatAclDoc.value, {
    data: aclBody,
    contentType: 'text/turtle'
  })
  console.log('ACL created', chatAclDoc.value, aclResponse.status)
}
async function addToPrivateTypeIndex(chatThing, me) {
  // Add to private type index
  const privateTypeIndex = store.any(me, ns.solid('privateTypeIndex')) as NamedNode | null
  if (!privateTypeIndex) {
    throw new Error('Private type index not found!')
  }
  await store.fetcher.load(privateTypeIndex)
  const reg = widgets.newThing(privateTypeIndex)
  const ins = [
    st(reg, ns.rdf('type'), ns.solid('TypeRegistration'), privateTypeIndex.doc()),
    st(reg, ns.solid('forClass'), ns.meeting('LongChat'), privateTypeIndex.doc()),
    st(reg, ns.solid('instance'), chatThing, privateTypeIndex.doc())
  ]
  await new Promise((resolve, reject) => {
    store.updater.update([], ins, function (_uri, ok, errm) {
      if (!ok) {
        reject(new Error(errm))
      } else {
        resolve()
      }
    })
  })
}

export async function createChat (invitee: NamedNode): Promise<NamedNode> {
  console.log('getMe')
  const me = await getMe()
  console.log('getPodRoot')
  const podRoot = await getPodRoot(me)
  console.log('createChatLocation')
  const chatContainer = createChatLocation(invitee, podRoot)
  console.log('createChatThing', chatContainer, me)
  const chatThing = await createChatThing(chatContainer, me)
  console.log('sendInvite', invitee, chatThing)
  await sendInvite(invitee, chatThing)
  console.log('setAcl')
  await setAcl(chatContainer, me, invitee)
  console.log('addToPrivateTypeIndex')
  await addToPrivateTypeIndex(chatThing, me)
  console.log('done!')
  return chatThing
}
