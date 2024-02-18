/*   Long Chat Pane
 **
 **  A long chat consists a of a series of chat files saved by date.
 */
import { authn } from 'solid-logic'
import * as UI from 'solid-ui'
import * as $rdf from 'rdflib'
const ns = UI.ns

const mainClass = ns.meeting('LongChat') // @@ something from SIOC?

const CHAT_LOCATION_IN_CONTAINER = 'index.ttl#this'

// const menuIcon = 'noun_897914.svg'
const SPANNER_ICON = 'noun_344563.svg'
// resize: horizontal;  min-width: 20em;
const SIDEBAR_COMPONENT_STYLE = UI.style.sidebarComponentStyle || ' padding: 0.5em; width: 100%;'
const SIDEBAR_STYLE = UI.style.sidebarStyle || 'overflow-x: auto; overflow-y: auto; border-radius: 1em; border: 0.1em solid white;'
// was purple border
export const longChatPane = {
  CHAT_LOCATION_IN_CONTAINER,

  // noun_704.svg Canoe   noun_346319.svg = 1 Chat  noun_1689339.svg = three chat
  icon: UI.icons.iconBase + 'noun_1689339.svg',

  name: 'long chat',

  label: function (subject, context) {
    const kb = context.session.store
    if (kb.holds(subject, ns.rdf('type'), ns.meeting('LongChat'))) {
      // subject is the object
      return 'Chat channnel'
    }
    if (kb.holds(subject, ns.rdf('type'), ns.sioc('Thread'))) {
      // subject is the object
      return 'Thread'
    }

    // Looks like a message -- might not havre any class declared
    if (
      kb.any(subject, ns.sioc('content')) &&
      kb.any(subject, ns.dct('created'))
    ) {
      return 'message'
    }
    return null // Suppress pane otherwise
  },

  mintClass: mainClass,

  mintNew: function (context, newPaneOptions) {
    const kb = context.session.store
    var updater = kb.updater
    if (newPaneOptions.me && !newPaneOptions.me.uri) {
      throw new Error('chat mintNew:  Invalid userid ' + newPaneOptions.me)
    }

    var newInstance = (newPaneOptions.newInstance =
      newPaneOptions.newInstance ||
      kb.sym(newPaneOptions.newBase + CHAT_LOCATION_IN_CONTAINER))
    var newChatDoc = newInstance.doc()

    kb.add(newInstance, ns.rdf('type'), ns.meeting('LongChat'), newChatDoc)
    kb.add(newInstance, ns.dc('title'), 'Chat channel', newChatDoc)
    kb.add(newInstance, ns.dc('created'), new Date(), newChatDoc)
    if (newPaneOptions.me) {
      kb.add(newInstance, ns.dc('author'), newPaneOptions.me, newChatDoc)
    }

    const aclBody = (me, AppendWrite) => `
    @prefix : <#>.
    @prefix acl: <http://www.w3.org/ns/auth/acl#>.
    @prefix foaf: <http://xmlns.com/foaf/0.1/>.
    @prefix lon: <./>.

    :ControlReadWrite
        a acl:Authorization;
        acl:accessTo lon:;
        acl:agent <${me.uri}>;
        acl:default lon:;
        acl:mode acl:Control, acl:Read, acl:Write.
    :Read
        a acl:Authorization;
        acl:accessTo lon:;
        acl:agentClass foaf:Agent;
        acl:default lon:;
        acl:mode acl:Read.
    :Read${AppendWrite}
        a acl:Authorization;
        acl:accessTo lon:;
        acl:agentClass acl:AuthenticatedAgent;
        acl:default lon:;
        acl:mode acl:Read, acl:${AppendWrite}.`

    return new Promise(function (resolve, reject) {
      updater.put(
        newChatDoc,
        kb.statementsMatching(undefined, undefined, undefined, newChatDoc),
        'text/turtle',
        function (uri2, ok, message) {
          if (ok) {
            resolve(newPaneOptions)
          } else {
            reject(
              new Error(
                'FAILED to save new chat channel at: ' + uri2 + ' : ' + message
              )
            )
          }
        }
      )
      // newChat container authenticated users Append only
      .then((result) => {
        return new Promise((resolve, reject) => {
          if (newPaneOptions.me) {
            kb.fetcher.webOperation('PUT', newPaneOptions.newBase + '.acl', {
              data: aclBody(newPaneOptions.me, 'Append'),
              contentType: 'text/turtle'
            })
            kb.fetcher.webOperation('PUT', newPaneOptions.newBase + 'index.ttl.acl', {
              data: aclBody(newPaneOptions.me, 'Write'),
              contentType: 'text/turtle'
            })
          }
          resolve(newPaneOptions)
        })
      })
    })
  },

  render: function (subject, context, paneOptions) {
    const dom = context.dom
    const kb = context.session.store

    /* Preferences
     **
     **  Things like whether to color text by author webid, to expand image URLs inline,
     ** expanded inline image height. ...
     ** In general, preferences can be set per user, per user/app combo, per instance,
     ** and per instance/user combo. Per instance? not sure about unless it is valuable
     ** for everyone to be seeing the same thing.
     */
    // const DCT = $rdf.Namespace('http://purl.org/dc/terms/')
    const preferencesFormText = `
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
    @prefix solid: <http://www.w3.org/ns/solid/terms#>.
    @prefix ui: <http://www.w3.org/ns/ui#>.
    @prefix : <#>.

    :this
      <http://purl.org/dc/elements/1.1/title> "Chat preferences" ;
      a ui:Form ;
      ui:parts ( :colorizeByAuthor :expandImagesInline :newestFirst :inlineImageHeightEms
                  :shiftEnterSendsMessage :authorDateOnLeft :showDeletedMessages).

    :colorizeByAuthor a ui:TristateField; ui:property solid:colorizeByAuthor;
    ui:label "Color user input by user".

    :expandImagesInline a ui:TristateField; ui:property solid:expandImagesInline;
    ui:label "Expand image URLs inline".

    :newestFirst a ui:TristateField; ui:property solid:newestFirst;
    ui:label "Newest messages at the top".

    :inlineImageHeightEms a ui:IntegerField; ui:property solid:inlineImageHeightEms;
    ui:label "Inline image height (lines)".

    :shiftEnterSendsMessage a ui:TristateField; ui:property solid:shiftEnterSendsMessage;
    ui:label "Shift-Enter sends message".

    :authorDateOnLeft a ui:TristateField; ui:property solid:authorDateOnLeft;
    ui:label "Author & date of message on left".

    :showDeletedMessages a ui:TristateField; ui:property solid:showDeletedMessages;
    ui:label "Show placeholders for deleted messages".
`
    const preferencesForm = kb.sym(
      'https://solid.github.io/solid-panes/longCharPane/preferencesForm.ttl#this'
    )
    const preferencesFormDoc = preferencesForm.doc()
    if (!kb.holds(undefined, undefined, undefined, preferencesFormDoc)) {
      // If not loaded already
      $rdf.parse(preferencesFormText, kb, preferencesFormDoc.uri, 'text/turtle') // Load form directly
    }
    const preferenceProperties = kb
      .statementsMatching(null, ns.ui.property, null, preferencesFormDoc)
      .map(st => st.object)

    //          Preferences Menu
    //
    // Build a menu a the side (@@ reactive: on top?)

    async function renderPreferencesSidebar (context) {
      // const noun = 'chat room'
      const { dom, noun } = context
      const preferencesArea = dom.createElement('div')
      preferencesArea.appendChild(panelCloseButton(preferencesArea))
      // @@ style below fix .. just make it onviious while testing
      preferencesArea.style = SIDEBAR_COMPONENT_STYLE
      preferencesArea.style.minWidth = '25em' // bit bigger
      preferencesArea.style.maxHeight = triptychHeight
      const menuTable = preferencesArea.appendChild(dom.createElement('table'))
      const registrationArea = menuTable.appendChild(dom.createElement('tr'))
      const statusArea = menuTable.appendChild(dom.createElement('tr'))

      var me = authn.currentUser()
      if (me) {
        await UI.login.registrationControl(
          { noun, me, statusArea, dom, div: registrationArea },
          chatChannel,
          mainClass
        )
        console.log('Registration control finsished.')
        preferencesArea.appendChild(
          UI.preferences.renderPreferencesForm(
            chatChannel,
            mainClass,
            preferencesForm,
            {
              noun,
              me,
              statusArea,
              div: preferencesArea,
              dom,
              kb
            }
          )
        )
      }
      return preferencesArea
    }

    // @@ Split out into solid-ui

    function panelCloseButton (panel) {
      function removePanel () {
        panel.parentNode.removeChild(panel)
      }
      const button =
        UI.widgets.button(context.dom, UI.icons.iconBase + 'noun_1180156.svg', 'close', removePanel)
      button.style.float = 'right'
      button.style.margin = '0.7em'
      delete button.style.backgroundColor // do not want white
      return button
    }
    async function preferencesButtonPressed (_event) {
      if (!preferencesArea) {
        // Expand
        preferencesArea = await renderPreferencesSidebar({ dom, noun: 'chat room' })
      }
      if (paneRight.contains(preferencesArea)) {
        // Close menu  (hide or delete??)
        preferencesArea.parentNode.removeChild(preferencesArea)
        preferencesArea = null
      } else {
        paneRight.appendChild(preferencesArea)
      }
    } // preferencesButtonPressed

    //          All my chats
    //
    /* Build a other chats list drawer the side
     */

    function renderCreationControl (refreshTarget, noun) {
      var creationDiv = dom.createElement('div')
      var me = authn.currentUser()
      var creationContext = {
        // folder: subject,
        div: creationDiv,
        dom: dom,
        noun: noun,
        statusArea: creationDiv,
        me: me,
        refreshTarget: refreshTarget
      }
      const chatPane = context.session.paneRegistry.byName('chat')
      const relevantPanes = [chatPane]
      UI.create.newThingUI(creationContext, context, relevantPanes) // Have to pass panes down  newUI
      return creationDiv
    }

    async function renderInstances (theClass, noun) {
      const instancesDiv = dom.createElement('div')
      var context = { dom, div: instancesDiv, noun: noun }
      await UI.login.registrationList(context, { public: true, private: true, type: theClass })
      instancesDiv.appendChild(renderCreationControl(instancesDiv, noun))
      return instancesDiv
    }

    var otherChatsArea = null
    async function otherChatsHandler (_event) {
      if (!otherChatsArea) { // Lazy build when needed
        // Expand
        otherChatsArea = dom.createElement('div')
        otherChatsArea.style = SIDEBAR_COMPONENT_STYLE
        otherChatsArea.style.maxHeight = triptychHeight
        otherChatsArea.appendChild(panelCloseButton(otherChatsArea))

        otherChatsArea.appendChild(await renderInstances(ns.meeting('LongChat'), 'chat'))
      }
      // Toggle visibility with button clicks
      if (paneLeft.contains(otherChatsArea)) {
        otherChatsArea.parentNode.removeChild(otherChatsArea)
      } else {
        paneLeft.appendChild(otherChatsArea)
      }
    } // otherChatsHandler

    //          People in the chat
    //
    /* Build a participants list drawer the side
     */
    var participantsArea
    function participantsHandler (_event) {
      if (!participantsArea) {
        // Expand
        participantsArea = dom.createElement('div')
        participantsArea.style = SIDEBAR_COMPONENT_STYLE
        participantsArea.style.maxHeight = triptychHeight
        participantsArea.appendChild(panelCloseButton(participantsArea))

        // Record my participation and display participants
        var me = authn.currentUser()
        if (!me) alert('Should be logeed in for partipants panel')
        UI.pad.manageParticipation(
          dom,
          participantsArea,
          chatChannel.doc(),
          chatChannel,
          me,
          {}
        )
      }
      // Toggle appearance in sidebar with clicks
      // Note also it can remove itself using the X button
      if (paneLeft.contains(participantsArea)) {
        // Close participants  (hide or delete??)
        participantsArea.parentNode.removeChild(participantsArea)
        participantsArea = null
      } else {
        paneLeft.appendChild(participantsArea)
      }
    } // participantsHandler

    var chatChannel = subject
    var selectedMessage = null
    var thread = null
    if (kb.holds(subject, ns.rdf('type'), ns.meeting('LongChat'))) {
      // subject is the chatChannel
      console.log('@@@ Chat channnel')

      // Looks like a message -- might not havre any class declared
    } else if (kb.holds(subject, ns.rdf('type'), ns.sioc('Thread'))) {
      // subject is the chatChannel
      console.log('Thread is subject ' + subject.uri)
      thread = subject
      const rootMessage = kb.the(null, ns.sioc('has_reply'), thread, thread.doc())
      if (!rootMessage) throw new Error('Thread has no root message ' + thread)
      chatChannel = kb.any(null, ns.wf('message'), rootMessage)
      if (!chatChannel) throw new Error('Thread root has no link to chatChannel')
    } else if ( // Looks like a message -- might not havre any class declared
      kb.any(subject, ns.sioc('content')) &&
      kb.any(subject, ns.dct('created'))
    ) {
      console.log('message is subject ' + subject.uri)
      selectedMessage = subject
      chatChannel = kb.any(null, ns.wf('message'), selectedMessage)
      if (!chatChannel) throw new Error('Message has no link to chatChannel')
    }

    var div = dom.createElement('div')

    // Three large columns for particpant, chat, Preferences.  formula below just as a note
    // const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    const triptychHeight = '20cm' // @@ need to be able to set to  window!
    var triptych = div.appendChild(dom.createElement('table'))
    triptych.style.maxHeight = '12"' // Screen max
    var paneRow = triptych.appendChild(dom.createElement('tr'))
    var paneLeft = paneRow.appendChild(dom.createElement('td'))
    var paneMiddle = paneRow.appendChild(dom.createElement('td'))
    var paneThread = paneRow.appendChild(dom.createElement('td'))
    var paneRight = paneRow.appendChild(dom.createElement('td'))
    var paneBottom = triptych.appendChild(dom.createElement('tr'))
    paneLeft.style = SIDEBAR_STYLE
    paneLeft.style.paddingRight = '1em'
    paneThread.style = SIDEBAR_STYLE
    paneThread.style.paddingLeft = '1em'
    paneRight.style = SIDEBAR_STYLE
    paneRight.style.paddingLeft = '1em'

    paneBottom.appendChild(dom.createElement('td'))
    const buttonCell = paneBottom.appendChild(dom.createElement('td'))
    paneBottom.appendChild(dom.createElement('td'))

    // Button to bring up participants drawer on left
    const participantsIcon = 'noun_339237.svg'
    var participantsButton = UI.widgets.button(
      dom,
      UI.icons.iconBase + participantsIcon,
      'participants ...'
    ) // wider var
    buttonCell.appendChild(participantsButton)
    participantsButton.addEventListener('click', participantsHandler)

    // Button to bring up otherChats drawer on left
    const otherChatsIcon = 'noun_1689339.svg' // long chat icon -- not ideal for a set of chats @@
    var otherChatsButton = UI.widgets.button(
      dom,
      UI.icons.iconBase + otherChatsIcon,
      'List of other chats ...'
    ) // wider var
    buttonCell.appendChild(otherChatsButton)
    otherChatsButton.addEventListener('click', otherChatsHandler)

    var preferencesArea = null
    const menuButton = UI.widgets.button(
      dom,
      UI.icons.iconBase + SPANNER_ICON,
      'Setting ...'
    ) // wider var
    buttonCell.appendChild(menuButton)
    menuButton.style.float = 'right'
    menuButton.addEventListener('click', preferencesButtonPressed)

    div.setAttribute('class', 'chatPane')
    const options = { infinite: true }
    const participantsHandlerContext = { noun: 'chat room', div, dom: dom }
    participantsHandlerContext.me = authn.currentUser() // If already logged on

    async function showThread(thread, options) {
        console.log('@@@@ showThread thread ' + thread)
        const newOptions = {} // @@@ inherit
        newOptions.thread = thread
        newOptions.includeRemoveButton = true

        newOptions.authorDateOnLeft = options.authorDateOnLeft
        newOptions.newestFirst = options.newestFirst

        paneThread.innerHTML = ''
        console.log('Options for showThread message Area', newOptions)

        const chatControl = await UI.infiniteMessageArea(
          dom,
          kb,
          chatChannel,
          newOptions
        )
        chatControl.style.resize = 'both'
        chatControl.style.overflow = 'auto'
        chatControl.style.maxHeight = triptychHeight
        paneThread.appendChild(chatControl)
    }

    async function buildPane () {
      let prefMap
      try {
        prefMap = await UI.preferences.getPreferencesForClass(
          chatChannel, mainClass, preferenceProperties, participantsHandlerContext)
      } catch (err) {
        UI.widgets.complain(participantsHandlerContext, err)
      }
      for (const propuri in prefMap) {
        options[propuri.split('#')[1]] = prefMap[propuri]
      }
      if (selectedMessage) {
        options.selectedMessage = selectedMessage
      }
      if (paneOptions.solo) {
        // This is the top pane, title, scrollbar etc are ours
        options.solo = true
      }
      if (thread) { // Rendereing a thread as first class object
          options.thread  = thread
      } else { // either show thread *or* allow new threads. Threads don't nest but they could
          options.showThread = showThread
      }
      const chatControl = await UI.infiniteMessageArea(
        dom,
        kb,
        chatChannel,
        options
      )
      chatControl.style.resize = 'both'
      chatControl.style.overflow = 'auto'
      chatControl.style.maxHeight = triptychHeight
      paneMiddle.appendChild(chatControl)
    }
    buildPane().then(console.log('async - chat pane built'))
    return div
  }
}
