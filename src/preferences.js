import * as UI from 'solid-ui'

export function renderPreferencesForm (subject, theClass, preferencesForm, context) {
  const prefContainer = context.dom.createElement('div')
  UI.participation.participationObject(subject, subject.doc(), context.me).then(
    participation => {
      const dom = context.dom
      function heading (text) {
        prefContainer.appendChild(dom.createElement('h5')).textContent = text
      }
      heading('My view of this ' + context.noun)
      UI.widgets.appendForm(
        dom,
        prefContainer,
        {},
        participation,
        preferencesForm,
        subject.doc(),
        (ok, mes) => {
          if (!ok) UI.widgets.complain(context, mes)
        }
      )

      heading('Everyone\'s  view of this ' + context.noun)
      UI.preferences.recordSharedPreferences(subject, context).then(context => {
        const sharedPreferences = context.sharedPreferences
        UI.widgets.appendForm(
          dom,
          prefContainer,
          {},
          sharedPreferences,
          preferencesForm,
          subject.doc(),
          (ok, mes) => {
            if (!ok) UI.widgets.complain(context, mes)
          }
        )

        heading('My default view of any ' + context.noun)
        UI.preferences.recordPersonalDefaults(theClass, context).then(
          context => {
            UI.widgets.appendForm(
              dom,
              prefContainer,
              {},
              context.personalDefaults,
              preferencesForm,
              context.preferencesFile,
              (ok, mes) => {
                if (!ok) UI.widgets.complain(context, mes)
              }
            )
          },
          err => {
            UI.widgets.complain(context, err)
          }
        )
      }).catch(err => {
        UI.widgets.complain(context, err)
      })
    },
    err => {
      // parp object fails
      prefContainer.appendChild(UI.widgets.errorMessageBlock(context.dom, err))
    }
  )
  return prefContainer
}
