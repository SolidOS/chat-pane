import { ns, widgets } from 'solid-ui'
import { store } from 'solid-logic'
import { NamedNode, st } from 'rdflib'


export async function setAcl(chatContainer, me, invitee) {
  // Some servers don't present a Link http response header
  // if the container doesn't exist yet, so refetch the container
  // now that it has been created:
  await store.fetcher.load(chatContainer)

  // FIXME: check the Why value on this quad:
  const chatAclDoc = store.any(chatContainer, new NamedNode('http://www.iana.org/assignments/link-relations/acl'))
  if (!chatAclDoc) {
    throw new Error('Chat ACL doc not found!')
  }

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
        acl:Read, acl:Append.
`
  const aclResponse = await store.fetcher.webOperation('PUT', chatAclDoc.value, {
    data: aclBody,
    contentType: 'text/turtle'
  })
}

export async function addToPrivateTypeIndex(chatThing, me) {
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