/*   Chat Pane
 **
 **  Plan is to support a finte number of chat graph shapes
 ** and investigate the interop between them.
 */
/* global $rdf */
import { store } from 'solid-logic'
import * as UI from 'solid-ui'

const ns = UI.ns

export const shortChatPane = {
  icon: UI.icons.iconBase + 'noun_346319.svg',

  name: 'chat',

  /*
   * As part of the work on merging the existing chat views (aka panes) into one view
   * https://github.com/solid/chat-pane/issues/17
   * we want to dis-incentivize the use of Small Chat until we've gotten the work done
   * by making it difficult to create new data resources that uses the Small Chat view
   * but we still want existing resources to be viewed by the Small Chat view
   */
  audience: [ns.solid('PowerUser')],

  /*   AN RRSAgent IRC log:

  <irc://localhost:6667/&mit>
      a    foaf:ChatChannel
      foaf:chatEventList
              [ rdf:_100
                 <#T19-10-58>
              rdf:_101
                 <#T19-10-58-1>
              rdf:_102
  ..
  <#T19-28-47-1>
      dc:creator
         [ a wn:Person; foaf:nick "timbl" ]
      dc:date
         "2016-03-15T19:28:47Z"
      dc:description
         "timbl has joined &mit"
      a    foaf:chatEvent.

  */

  label: function (subject, context) {
    const kb = context.session.store
    const n = kb.each(subject, ns.wf('message')).length
    if (n > 0) return 'Chat (' + n + ')' // Show how many in hover text

    if (kb.holds(subject, ns.rdf('type'), ns.meeting('Chat'))) {
      // subject is the file
      return 'Meeting chat'
    }
    if (kb.holds(undefined, ns.rdf('type'), ns.foaf('ChatChannel'), subject)) {
      // subject is the file
      return 'IRC log' // contains anything of this type
    }
    return null // Suppress pane otherwise
  },

  mintClass: ns.meeting('Chat'),

  mintNew: function (context, newPaneOptions) {
    // This deprecates the creation of short Chats after 2023-04-03.
    // The mintNew function will be removed/commented out in a few months.
    if (!confirm('short Chat is deprecated in favor of long Chat.' +
      '\nEmbedded chat for comments and existing short Chats will work.' +
      '\nYou can report any issues at https://github.com/SolidOS/chat-pane ?' +
      '\n\nDo you really want to create a new deprecated short Chat?')) return
    const kb = context.session.store
    const updater = kb.updater
    if (newPaneOptions.me && !newPaneOptions.me.uri) {
      throw new Error('chat mintNew:  Invalid userid ' + newPaneOptions.me)
    }

    const newInstance = (newPaneOptions.newInstance =
      newPaneOptions.newInstance ||
      kb.sym(newPaneOptions.newBase + 'index.ttl#this'))
    const newChatDoc = newInstance.doc()

    kb.add(newInstance, ns.rdf('type'), ns.meeting('Chat'), newChatDoc)
    kb.add(newInstance, ns.dc('title'), 'Chat', newChatDoc)
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
              new Error('FAILED to save new tool at: ' + uri2 + ' : ' + message)
            )
          }
        }
      )
    })
  },

  render: function (subject, context) {
    const kb = context.session.store
    const dom = context.dom
    const complain = function complain (message, color) {
      const pre = dom.createElement('pre')
      pre.setAttribute('style', 'background-color: ' + color || '#eed' + ';')
      div.appendChild(pre)
      pre.appendChild(dom.createTextNode(message))
    }

    const div = dom.createElement('div')
    div.setAttribute('class', 'chatPane')
    const options = {} // Like newestFirst
    let messageStore
    if (kb.holds(subject, ns.rdf('type'), ns.meeting('Chat'))) {
      // subject may be the file
      messageStore = subject.doc()
    } else if (kb.any(subject, UI.ns.wf('message'))) {
      messageStore = store.any(subject, UI.ns.wf('message')).doc()
    } else if (
      kb.holds(undefined, ns.rdf('type'), ns.foaf('ChatChannel'), subject) ||
      kb.holds(subject, ns.rdf('type'), ns.foaf('ChatChannel'))
    ) {
      // subject is the file
      const ircLogQuery = function () {
        const query = new $rdf.Query('IRC log entries')
        const v = []
        const vv = ['chan', 'msg', 'date', 'list', 'pred', 'creator', 'content']
        vv.forEach(function (x) {
          query.vars.push((v[x] = $rdf.variable(x)))
        })
        query.pat.add(v.chan, ns.foaf('chatEventList'), v.list) // chatEventList
        query.pat.add(v.list, v.pred, v.msg) //
        query.pat.add(v.msg, ns.dc('date'), v.date)
        query.pat.add(v.msg, ns.dc('creator'), v.creator)
        query.pat.add(v.msg, ns.dc('description'), v.content)
        return query
      }
      messageStore = subject.doc()
      options.query = ircLogQuery()
    } else {
      complain('Unknown chat type')
    }

    //    var context = {dom, div}
    //    UI.authn.logIn(context).then( context => { // The widget itself sees to login

    div.appendChild(UI.messageArea(dom, kb, subject, messageStore, options))
    kb.updater.addDownstreamChangeListener(messageStore, function () {
      UI.widgets.refreshTree(div)
    }) // Live update
    //    })

    return div
  }
}
