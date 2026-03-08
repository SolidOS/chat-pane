import { store, authn, authSession } from 'solid-logic'
import * as $rdf from 'rdflib'
import * as UI from 'solid-ui'
import { longChatPane } from '../src/longChatPane.js'
import { getChat } from '../src/create.ts'
import { context, fetcher } from './context'

window.$rdf = $rdf
window.UI = UI

const loginBanner = document.getElementById('loginBanner')
const webId = document.getElementById('webId')
const chatUriInput = document.getElementById('chatUri')
const loadChatButton = document.getElementById('loadChat')
const currentChatDiv = document.getElementById('currentChat')
const menuContainer = document.getElementById('menu')
const chatPaneContainer = document.getElementById('chatPane')

loginBanner.appendChild(UI.login.loginStatusBox(document, null, {}))

async function finishLogin () {
  await authSession.handleIncomingRedirect()
  // Clear fetch auth metadata cached before login (often read-only WAC-Allow from anonymous requests).
  // Without this, updater.editable() can stay false even when the user can PATCH after authentication.
  store.updater.flagAuthorizationMetadata(store)
  const session = authSession
  if (session.info.isLoggedIn) {
    const me = authn.currentUser()
    // Update the page with the status.
    webId.innerHTML = 'Logged in as: ' + me.uri
  } else {
    webId.innerHTML = ''
  }
}

const menuDiv = document.createElement('div')

async function renderMenuDiv () {
  menuDiv.innerHTML = await getInvitesList()
}

window.followLink = async function (from, follow, multiple) {
  if (!from || !follow) {
    return multiple ? [] : null
  }
  const subject = $rdf.sym(from)
  const doc = subject.doc()
  await new Promise((resolve, reject) => {
    store.fetcher.load(doc).then(resolve, reject)
  })
  const predicate = $rdf.sym(follow)
  if (multiple) {
    return store.each(subject, predicate).map(n => n.value)
  }
  const value = store.any(subject, predicate)
  return value ? value.value : null
}

function toLi (uri) {
  return `<li><a href="?#${encodeURIComponent(uri)}">${uri}</a></li>`
}

window.inviteSomeone = async function () {
  const invitee = store.namedNode(document.getElementById('invitee').value)
  const created = await getChat(invitee)
  console.log(created)
  renderMenuDiv()
}

async function getInvitesList () {
  const webId = authSession.webId
  if (!webId) {
    return '<h2>Your Invites:</h2><p>Log in to load invites.</p>'
  }
  const globalInbox = await window.followLink(webId, UI.ns.ldp('inbox'))
  if (!globalInbox) {
    return '<h2>Your Invites:</h2><p>No inbox found.</p>'
  }
  const inboxItems = await window.followLink(globalInbox, UI.ns.ldp('contains'), true)
  const invites = []
  const promises = inboxItems.map(async x => {
    try {
      const inboxMsgTypes = await window.followLink(x, UI.ns.rdf('type'), true)
      const isLongChatInvite = (inboxMsgTypes.indexOf('http://www.w3.org/ns/pim/meeting#LongChatInvite') !== -1)
      if (isLongChatInvite) {
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

async function appendChatPane (uri) {
  const subject = $rdf.sym(uri)
  const doc = subject.doc()

  await new Promise((resolve, reject) => {
    store.fetcher.load(doc).then(resolve, reject)
  })

  const options = {}
  if (authSession.webId) {
    renderMenuDiv()
  } else {
    menuDiv.innerHTML = '<p>Log in to load invites and chats.</p>'
  }
  menuContainer.innerHTML = ''
  menuContainer.appendChild(menuDiv)
  const paneDiv = longChatPane.render(subject, context, options)
  chatPaneContainer.innerHTML = ''
  chatPaneContainer.appendChild(paneDiv)
}

const defaultChatUri = 'https://bourgeoa.pivot-test.solidproject.org:3000/public/longChat/index.ttl#this'

function getInitialChatUri () {
  const hashUri = decodeURIComponent(window.location.hash.slice(1))
  return hashUri || defaultChatUri
}

function showCurrentChat (uri) {
  currentChatDiv.innerHTML = `Current chat: <a href="${uri}" target="_blank" rel="noopener noreferrer">${uri}</a>`
}

async function loadChatUri (uri) {
  if (!uri) return
  const trimmedUri = uri.trim()
  if (!trimmedUri) return
  chatUriInput.value = trimmedUri
  window.location.hash = encodeURIComponent(trimmedUri)
  showCurrentChat(trimmedUri)
  await fetcher.load(trimmedUri)
  await appendChatPane(trimmedUri)
}

loadChatButton.addEventListener('click', () => {
  loadChatUri(chatUriInput.value).catch(err => {
    console.error('Failed to load chat URI', err)
  })
})

chatUriInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    loadChatUri(chatUriInput.value).catch(err => {
      console.error('Failed to load chat URI', err)
    })
  }
})

const initialUri = getInitialChatUri()
chatUriInput.value = initialUri
// Load the first chat only after login redirect handling, so initial HTTP metadata is fetched
// in authenticated context and editable() does not get stuck with stale anonymous permissions.
finishLogin().then(() => {
  loadChatUri(initialUri).catch(err => {
    console.error('Failed to initialize chat pane', err)
  })
})
