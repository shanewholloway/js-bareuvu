export function bareuvu(headline, ...fn_defines) {
  return _bareuvu(new _bareuvu_shared_(), headline, ...fn_defines) }

export default bareuvu


function _bareuvu(_shared, headline, ...fn_defines) {
  let _state = {coll:[], before: [], after:[], suites:[]}
  let self = _shared.bind_suite(_state, {run})

  for (let fn_def of fn_defines)
    fn_def(self)

  return self

  async function run(rptr, summary={pass:0, fail:0, skip:0, suites:0}) {
    // "only" mode for any tests in collection?
    let suite_kind = _shared.status.get(self)
    let sel_kind = _state.coll.some(e => 'only' === e.kind) ? 'only' : 'test'
    let is_only = _shared.status.is_only && ('only' === sel_kind || 'only' === suite_kind)

    rptr = rptr.declare_suite(headline, suite_kind)
    let rptr_token = rptr.begin(headline)

    if (is_only || 'suite' === suite_kind) {
      // if this suite or any test is selected
      summary.suites++
      rptr.step(rptr_token, 'tests', headline)
      await _suite_tests(sel_kind, rptr, summary)
    }

    if (_state.suites[0]) {
      rptr.step(rptr_token, 'suites', headline)
      await _subsuites(rptr, summary)
    }

    rptr.end(rptr_token, headline)
    return summary
  }


  async function _invoke_test({name, kind, fn, args}, dep, test_rptr, summary) {
    await dep

    let ctx={__proto__: self.base_ctx, name, args}
    let result, ts=[Date.now()]
    try {
      for (let before_fn of _state.before)
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
      for (let after_fn of _state.after)
        await after_fn(ctx)
    }

    ts[0] = Date.now() - ts[0]
    await test_rptr.test_result(name, kind, result, ts)
  }

  async function _suite_tests(sel_kind, rptr, summary) {
    let dep = Promise.resolve()
    for (let rec of _state.coll) {
      let selected = sel_kind === rec.kind
      let test_rptr = rptr.declare_test(rec.name, rec.kind, selected)
      if (selected)
        dep = _invoke_test(rec, dep, test_rptr, summary)
      else summary.skip++
    }
    await dep
  }

  async function _subsuites(rptr, summary) {
    if (rptr.allow_parallel)
      await Promise.all(
        _state.suites.map(
          rec => rec.suite.run(rptr, summary) ))
    else
      for (let rec of _state.suites)
        await rec.suite.run(rptr, summary)
  }
}


const _suite_api_ = {
  base_ctx: {},
  with_ctx(opt) {
    this.base_ctx = {... this.base_ctx, ... opt}
    return this
  },

  async run_main(rptr, opt={}) {
    rptr.begin_main(opt)
    let res = await this.run(rptr)
    rptr.end_main(res, opt)
    return res
  },
}


class _bareuvu_shared_ {
  constructor() { this.status = new Map() }

  bind_suite(_state, api) {
    let suite = this.as_test_api('test',
      this.as_test_fn(_state.coll))

    this.status.set(suite, 'suite')

    return Object.assign(suite,
      _suite_api_, api,
      { before: this.as_fns(_state.before),
        after: this.as_fns(_state.after),
        suite: this.as_add_suite(_state.suites)})
  }

  as_fns(lst) { return lst.push.bind(lst)}
  as_test_fn(_coll) {
    return kind => (name, fn, ...args) =>
      _coll.push({name, kind, fn, args}) }

  as_test_api(kind, fn) {
    let r = fn(kind)
    r[kind] = r
    r.only = fn('only')
    r.skip = fn('skip')
    return r }

  as_add_suite(_suites) {
    return this.as_test_api('suite',
      kind => (headline, ...args) => {
        let suite = _bareuvu(this, headline, ...args)
        this.status.set(suite, kind)
        if ('only' === kind)
          this.status.is_only = true

        _suites.push({headline, kind, suite})
        return suite })
  }
}

