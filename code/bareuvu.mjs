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
      run, run_main,
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

  async function run_main(rptr, opt={}) {
    rptr.begin_main(opt)
    let res = await run(rptr)
    res.ok = 0 === res.fail
    rptr.end_main(res, opt)
    return res
  }

  async function run(rptr, summary={pass:0, fail:0, skip:0, suites:0}) {
    // "only" mode for any tests in collection?
    let suite_kind = _suite_status.get(self)
    let sel_kind = _coll.some(e => 'only' === e.kind) ? 'only' : 'test'
    let is_only = _suite_status.is_only && ('only' === sel_kind || 'only' === suite_kind)

    rptr = rptr.declare_suite(headline, suite_kind)
    let rptr_token = rptr.begin(headline)

    summary.suites++
    if (is_only || 'suite' === suite_kind) {
      // if this suite or any test is selected
      rptr.step(rptr_token, 'tests', headline)
      await _invoke_test_coll(_coll, sel_kind, rptr, summary)
    }

    if (_suites[0]) {
      rptr.step(rptr_token, 'suites', headline)
      if (rptr.allow_parallel)
        await _suites_parallel(_suites, rptr, summary)
      else
        await _suites_serial(_suites, rptr, summary)
    }

    rptr.end(rptr_token, headline)
    return summary
  }


  async function _invoke_test_coll(_coll, sel_kind, rptr, summary) {
    let dep = Promise.resolve()
    for (let rec of _coll) {
      let test_rptr = rptr.declare_test(rec.name, rec.kind)
      if (sel_kind === rec.kind)
        dep = _invoke_test(rec, dep, test_rptr, summary)
      else summary.skip++
    }
    await dep
  }


  async function _invoke_test({name, kind, fn, args}, dep, test_rptr, summary) {
    await dep

    let ctx={__proto__: base_ctx, name, args}
    let result, ts=[Date.now()]
    try {
      for (let before_fn of _before)
        await before_fn(ctx)

      ts[1] = Date.now()

      await fn(ctx)

      ts[1] = Date.now() - ts[1]
      summary.pass++
      result = test_rptr.format_pass(name, ts[1])

    } catch (err) {
      summary.fail++
      result = test_rptr.format_error(name, err)

    } finally {
      for (let after_fn of _after)
        await after_fn(ctx)
    }

    ts[0] = Date.now() - ts[0]
    await test_rptr.test_result(name, kind, result, ts)
  }


  async function _suites_serial(_suites, rptr, summary) {
    for (let rec of _suites)
      await rec.suite.run(rptr, summary)
  }

  async function _suites_parallel(_suites, rptr, summary) {
    let deps = []
    for (let rec of _suites)
      deps.push(
        rec.suite.run(rptr, summary))

    // process sub-suites in parallel
    while (0 !== deps.length)
      await deps.pop()
  }
}

