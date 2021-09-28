import {bareuvu, assert} from 'bareuvu'
import basic_rptr from 'bareuvu/esm/rptr/basic.mjs'

let tst_outer = bareuvu('core')

tst_outer.test('smoke', ()=> {
  assert.ok('yes') })

let tsts_inner = tst_outer.suite('async subsuite', suite => {
  suite.before(async () => {
    await new Promise(y => setTimeout(y,50))
  })

  suite.test('async smoke', async ()=> {
    assert.ok('before')
    await new Promise(y => setTimeout(y,101))
    assert.ok('after')
  })

  suite.after(async () => {
    await new Promise(y => setTimeout(y,74))
  })
})

tsts_inner.test('inside-outside', async (ctx) => {
  await new Promise(y => setTimeout(y,4))
  assert.ok(true, 'workeded') })

tst_outer.test('error', ()=> {
  assert.ok(!false, 'fake problems') })

tst_outer.run_main(basic_rptr, {process})

