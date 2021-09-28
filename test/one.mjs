import {bareuvu, assert} from 'bareuvu'
import basic_rptr from 'bareuvu/esm/rptr/basic.mjs'

let tst_outer = bareuvu('core')

tst_outer.test('smoke', ()=> {
  assert.ok('yes') })

let tsts_inner = tst_outer.suite('async subsuite', suite => {
  suite.test('async smoke', async ()=> {
    assert.ok('before')
    await new Promise(y => setTimeout(y,200))
    assert.ok('after')
  })
})

tsts_inner.test('inside-outside', () => {
  assert.ok(true, 'workeded') })

tst_outer.test('error', ()=> {
  assert.ok(false, 'fake problems') })

tst_outer.run(basic_rptr)
