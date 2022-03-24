import { store, authn, authSession } from 'solid-logic'
import * as $rdf from 'rdflib'
import * as UI from 'solid-ui'
import { longChatPane } from '../src/longChatPane.js'
import { getChat } from '../src/create.ts'
import { context, fetcher } from './context'

const loginBanner = document.getElementById('loginBanner')
const webId = document.getElementById('webId')

loginBanner.appendChild(UI.login.loginStatusBox(document, null, {}))

async function finishLogin () {
  await authSession.handleIncomingRedirect()
  const session = authSession
  if (session.info.isLoggedIn) {
    // Update the page with the status.
    webId.innerHTML = 'Logged in as: ' + authn.currentUser().uri
  } else {
    webId.innerHTML = ''
  }
}

finishLogin()

const menuDiv = document.createElement('div')

async function renderMenuDiv () {
  console.log('get invites list')
  menuDiv.innerHTML = await getInvitesList()
  console.log('get chats list')
  menuDiv.innerHTML += await getChatsList()
}

window.followLink = async function (from, follow, multiple) {
  const subject = $rdf.sym(from)
  const doc = subject.doc()
  await new Promise((resolve, reject) => {
    store.fetcher.load(doc).then(resolve, reject)
  })
  const predicate = $rdf.sym(follow)
  if (multiple) {
    return store.each(subject, predicate).map(n => n.value)
  }
  return store.any(subject, predicate).value
}

function toLi (uri) {
  return `<li><a href="?#${encodeURIComponent(uri)}">${uri}</a></li>`
}

async function getChatsList () {
  const { instances } = await UI.login.findAppInstances({}, $rdf.sym('http://www.w3.org/ns/pim/meeting#LongChat'))
  return `<h2>Your chats:
<ul>
  ${instances.map(n => n.value).map(toLi)}
</ul>`
}

window.inviteSomeone = async function () {
  const invitee = store.namedNode(document.getElementById('invitee').value)
  const created = await getChat(invitee)
  console.log(created)
  renderMenuDiv()
}

async function getInvitesList () {
  const webId = authSession.webId
  const globalInbox = await window.followLink(webId, UI.ns.ldp('inbox'))
  const inboxItems = await window.followLink(globalInbox, UI.ns.ldp('contains'), true)
  const invites = []
  const promises = inboxItems.map(async x => {
    try {
      const inboxMsgTypes = await window.followLink(x, UI.ns.rdf('type'), true)
      const isLongChatInvite = (inboxMsgTypes.indexOf('http://www.w3.org/ns/pim/meeting#LongChatInvite') !== -1)
      if (isLongChatInvite) {
        console.log('new chat!', x)
        const chatUrl = await window.followLink(x, UI.ns.rdf('seeAlso'))
        invites.push(chatUrl)
      }
    } catch (e) {
      console.error('Failed to parse inbox item', x)
    }
  })
  await Promise.all(promises)
  return `<h2>Your Invites:
  <ul>
    ${invites.map(toLi)}
  </ul>
  Invite someone: <input id="invitee"><button onclick="inviteSomeone()">Send Invite</button>`
}

async function appendChatPane (dom, uri) {
  const subject = $rdf.sym(uri)
  const doc = subject.doc()

  await new Promise((resolve, reject) => {
    store.fetcher.load(doc).then(resolve, reject)
  })

  const options = {}
  renderMenuDiv()
  dom.body.appendChild(menuDiv)
  console.log('chat', subject)
  const paneDiv = longChatPane.render(subject, context, options)
  dom.body.appendChild(paneDiv)
}

const webIdToShow = 'https://solidos.solidcommunity.net/Team/SolidOs%20team%20chat/index.ttl#this'

fetcher.load(webIdToShow).then(() => {
  appendChatPane(document, webIdToShow)
})
