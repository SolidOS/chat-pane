/*   Long Chat Pane
 **
 **  A long chat consists a of a series of chat files saved by date.
 */
/* global alert, $rdf */

const UI = require('solid-ui')
const ns = UI.ns
const kb = UI.store
const mainClass = ns.meeting('LongChat') // @@ something from SIOC?

// const menuIcon = 'noun_897914.svg'
const SPANNER_ICON = 'noun_344563.svg'

module.exports = {
  // noun_704.svg Canoe   noun_346319.svg = 1 Chat  noun_1689339.svg = three chat
  icon: UI.icons.iconBase + 'noun_1689339.svg',

  name: 'long chat',

  label: function (subject) {
    if (kb.holds(subject, ns.rdf('type'), ns.meeting('LongChat'))) {
      // subject is the object
      return 'Chat channnel'
    } // Looks like a message -- might not havre any class declared
    if (
      kb.any(subject, ns.sioc('content')) &&
      kb.any(subject, ns.dct('created'))
    ) {
      return 'message'
    }
    return null // Suppress pane otherwise
  },

  mintClass: mainClass,

  mintNew: function (newPaneOptions) {
    var updater = kb.updater
    if (newPaneOptions.me && !newPaneOptions.me.uri) {
      throw new Error('chat mintNew:  Invalid userid ' + newPaneOptions.me)
    }

    var newInstance = (newPaneOptions.newInstance =
      newPaneOptions.newInstance ||
      kb.sym(newPaneOptions.newBase + 'index.ttl#this'))
    var newChatDoc = newInstance.doc()

    kb.add(newInstance, ns.rdf('type'), ns.meeting('LongChat'), newChatDoc)
    kb.add(newInstance, ns.dc('title'), 'Chat channel', newChatDoc)
    kb.add(newInstance, ns.dc('created'), new Date(), newChatDoc)
    if (newPaneOptions.me) {
      kb.add(newInstance, ns.dc('author'), newPaneOptions.me, newChatDoc)
    }

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
    })
  },

  render: function (subject, dom, paneOptions) {
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
    ui:part :colorizeByAuthor, :expandImagesInline, :newestFirst, :inlineImageHeightEms;
    ui:parts ( :colorizeByAuthor :expandImagesInline :newestFirst :inlineImageHeightEms ).

:colorizeByAuthor a ui:TristateField; ui:property solid:colorizeByAuthor;
  ui:label "Color user input by user".
:expandImagesInline a ui:TristateField; ui:property solid:expandImagesInline;
  ui:label "Expand image URLs inline".
:newestFirst a ui:TristateField; ui:property solid:newestFirst;
  ui:label "Newest messages at the top".

:inlineImageHeightEms a ui:IntegerField; ui:property solid:inlineImageHeightEms;
  ui:label "Inline image height (lines)".

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

    //          Settings Menu
    //
    // Build a menu a the side (@@ reactive: on top?)
    var menuArea
    async function menuHandler (event) {
      if (!menuArea) {
        // Expand
        menuArea = paneRight.appendChild(dom.createElement('div'))
        // @@ style below fix .. just make it onviious while testing
        menuArea.style =
          'border-radius: 1em; border: 0.1em solid purple; padding: 0.5em; margin-left: 1em;' +
          'resize: horizontal; overflow:scroll; min-width: 25em;'
        menuArea.style.maxHeight = triptychHeight
        const menuTable = menuArea.appendChild(dom.createElement('table'))
        const registrationArea = menuTable.appendChild(dom.createElement('tr'))
        const statusArea = menuTable.appendChild(dom.createElement('tr'))

        var me = UI.authn.currentUser()
        if (me) {
          var context = {
            noun: 'chat room',
            me: me,
            statusArea: statusArea,
            div: registrationArea,
            dom: dom
          }
          await UI.authn.registrationControl(context, chatChannel, mainClass)
          console.log('Registration control finsished.')
          var context2 = {
            noun: 'chat room',
            me: me,
            statusArea: statusArea,
            div: menuArea,
            dom,
            kb
          }
          menuArea.appendChild(
            UI.preferences.renderPreferencesForm(
              chatChannel,
              mainClass,
              preferencesForm,
              context2
            )
          )
        }
      } else {
        // Close menu  (hide or delete??)
        menuArea.parentNode.removeChild(menuArea)
        menuArea = null
      }
    } // menuHandler

    //          People
    //
    /* Build a particpants a the side
     * (@@ reactive: on top?)
     */
    var participantsArea
    function particpantsHandler (event) {
      if (!participantsArea) {
        // Expand
        participantsArea = paneLeft.appendChild(dom.createElement('div'))
        participantsArea.style =
          'border-radius: 1em; border: 0.1em solid purple; padding: 0.5em; margin-right: 1em;' +
          ' resize: horizontal; overflow:scroll; min-width: 20em;'
        participantsArea.style.maxHeight = triptychHeight

        // Record my participation and display participants
        var me = UI.authn.currentUser()
        if (!me) alert('Should be logeed in for partipants panel')
        UI.pad.manageParticipation(
          dom,
          participantsArea,
          chatChannel.doc(),
          chatChannel,
          me,
          {}
        )
      } else {
        // Close particpants  (hide or delete??)
        participantsArea.parentNode.removeChild(participantsArea)
        participantsArea = null
      }
    } // particpantsHandler

    var chatChannel = subject
    var selectedMessage = null
    if (kb.holds(subject, ns.rdf('type'), ns.meeting('LongChat'))) {
      // subject is the chatChannel
      console.log('Chat channnel')

      // Looks like a message -- might not havre any class declared
    } else if (
      kb.any(subject, ns.sioc('content')) &&
      kb.any(subject, ns.dct('created'))
    ) {
      console.log('message')
      selectedMessage = subject
      chatChannel = kb.any(null, ns.wf('message'), selectedMessage)
      if (!chatChannel) throw new Error('Message has no link to chatChannel')
    }

    var div = dom.createElement('div')

    // Three large colons for particpant, chat, settings
    const triptychHeight = '30cm' // @@ need to be able to set to  window!
    var triptych = div.appendChild(dom.createElement('table'))
    triptych.style.maxHeight = '12"' // Screen max
    var paneRow = triptych.appendChild(dom.createElement('tr'))
    var paneLeft = paneRow.appendChild(dom.createElement('td'))
    var paneMiddle = paneRow.appendChild(dom.createElement('td'))
    var paneRight = paneRow.appendChild(dom.createElement('td'))
    var paneBottom = triptych.appendChild(dom.createElement('tr'))

    paneBottom.appendChild(dom.createElement('td'))
    const buttonCell = paneBottom.appendChild(dom.createElement('td'))
    paneBottom.appendChild(dom.createElement('td'))

    // Button to bring up particpants drawer on left
    const particpantsIcon = 'noun_339237.svg'
    var particpantsButton = UI.widgets.button(
      dom,
      UI.icons.iconBase + particpantsIcon,
      'particpants ...'
    ) // wider var
    buttonCell.appendChild(particpantsButton)
    particpantsButton.addEventListener('click', particpantsHandler)

    var menuButton = UI.widgets.button(
      dom,
      UI.icons.iconBase + SPANNER_ICON,
      'Menu ...'
    ) // wider var
    buttonCell.appendChild(menuButton)
    menuButton.style.float = 'right'
    menuButton.addEventListener('click', menuHandler)

    div.setAttribute('class', 'chatPane')
    const options = { infinite: true } //  was: menuHandler: menuHandler
    const context = { noun: 'chat room', div, dom }
    context.me = UI.authn.currentUser() // If already logged on

    UI.preferences
      .getPreferencesForClass(
        chatChannel,
        mainClass,
        preferenceProperties,
        context
      )
      .then(
        prefMap => {
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
          const chatControl = UI.infiniteMessageArea(
            dom,
            kb,
            chatChannel,
            options
          )
          chatControl.style.resize = 'both'
          chatControl.style.overflow = 'auto'
          chatControl.style.maxHeight = triptychHeight
          paneMiddle.appendChild(chatControl)
        },
        err => UI.widgets.complain(context, err)
      )

    return div
  }
}
