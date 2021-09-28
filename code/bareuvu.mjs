export function bareuvu(headline, ...fn_defines) {
  return _bareuvu(new Map(), headline, ...fn_defines) }

export default bareuvu


function _bareuvu(_suite_status, headline, ...fn_defines) {
  let self, _coll=[], _before=[], _after=[], _suites=[], base_ctx = {};

  {
    let as_fns = lst => lst.push.bind(lst)
    let as_test = kind => (name, fn, ...args) => _coll.push({name, kind, fn, args})
    let as_suite = kind =>
      (headline, ...args) => {
        let suite = _bareuvu(_suite_status, headline, ...args)
        _suites.push({headline, kind, suite})
        _suite_status.set(suite, kind)
        if ('only' === kind)
          _suite_status.is_only = true
        return suite }

    let ns = {
      run,
      test: as_test('test'),
      only: as_test('only'),
      skip: as_test('skip'),
      before: as_fns(_before),
      after: as_fns(_after),

      base_ctx,
      with_ctx: opt => (Object.assign(base_ctx, opt), self),

      suite: Object.assign(
        as_suite('suite'),
        { only: as_suite('only'),
          skip: as_suite('skip') })
    }
    self = Object.assign(ns.test, ns)

    _suite_status.set(self, 'suite')
  }

  for (let fn_def of fn_defines)
    fn_def(self)

  return self

  async function run(rptr) {
    // "only" mode for any tests in collection?
    let suite_kind = _suite_status.get(self)
    let sel_kind = _coll.some(e => 'only' === e.kind) ? 'only' : 'test'
    let is_only = _suite_status.is_only && ('only' === sel_kind || 'only' === suite_kind)

    let suite_rptr = rptr.declare_suite(headline, suite_kind)
    let rptr_token = suite_rptr.begin(headline)

    if (is_only || 'suite' === suite_kind) {
      // if this suite or any test is selected
      suite_rptr.step(rptr_token, 'tests', headline)
      await _invoke_test_coll(_coll, sel_kind, suite_rptr)
    }

    if (_suites[0]) {
      suite_rptr.step(rptr_token, 'suites', headline)
      await _invoke_suites(_suites, suite_rptr)
    }

    suite_rptr.end(rptr_token, headline)
  }


  async function _invoke_test_coll(_coll, sel_kind, suite_rptr) {
    let dep = Promise.resolve()
    for (let rec of _coll) {
      let sub_rptr = suite_rptr.declare_test(rec.name, rec.kind)
      if (sel_kind === rec.kind)
        dep = _invoke_test(rec, dep, sub_rptr)
    }
    await dep
  }


  async function _invoke_test({name, kind, fn, args}, dep, test_rptr) {
    await dep

    let ctx={__proto__: base_ctx, name, args}
    let result, ts=[Date.now()]
    try {
      for (let before_fn of _before)
        await before_fn(ctx)

      ts[1] = Date.now()

      await fn(ctx)

      ts[1] = Date.now() - ts[1]
      result = test_rptr.format_pass(name, ts[1])

    } catch (err) {
      result = test_rptr.format_error(name, err)

    } finally {
      for (let after_fn of _after)
        await after_fn(ctx)
    }

    ts[0] = Date.now() - ts[0]
    await test_rptr.test_result(name, kind, result, ts)
  }


  async function _invoke_suites(_suites, suite_rptr) {
    let deps = []
    for (let rec of _suites) {
      deps.push(rec.suite.run(suite_rptr))
    }

    // process sub-suites in parallel
    while (0 !== deps.length)
      await deps.pop()
  }
}

