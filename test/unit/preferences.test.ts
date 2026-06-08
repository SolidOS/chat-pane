import { sym } from 'rdflib'
import { renderPreferencesForm } from '../../src/preferences'
import { JSDOM } from 'jsdom'

const window = new JSDOM('<!DOCTYPE html><p>Hello world</p>').window
const dom = window.document

describe('renderPreferencesForm', () => {
  it('exists', () => {
    expect(renderPreferencesForm).toBeInstanceOf(Function)
  })
  it('runs', () => {
    const subject = sym('https://test.test')
    const theClass = {}
    const preferencesForm = {}
    const context = { dom }
    expect(renderPreferencesForm(
      subject, theClass, preferencesForm, context
    )).toBeTruthy()
  })
})
