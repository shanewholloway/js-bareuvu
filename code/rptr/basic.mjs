export default {
  allow_parallel: false,
  ms_threshold: 150,

  declare_suite(info) {
    let {headline, kind} = info
    ;(this.suites || []).push({headline, kind})
    return {__proto__: this, tests: [], suites: []} },

  begin_main() { console.log('') },
  end_main(res, opt) {
    console.log(res)
    if (opt.process)
      opt.process.exit(res.fail ? 1 : 0)
  },

  begin(info) {},
  end(token, info) {},
  step(token, section, info) {
    if ('tests' === section)
      console.log(`Section: "${info.headline}" [${info.n_tests} tests]\n`)
  },
  step_end(token, section, info) { console.log('') },


  declare_test(name, kind) {
    let ans = {name, kind}
    ;(this.tests || []).push(ans)
    return {__proto__: this, ans} },

  format_pass(name, ts1) {
    let msg = ts1 >= this.ms_threshold
      ? `${name} (${(.001*ts1).toFixed(3)}s)`
      : `${name}`
    return { ok: true, msg } },

  format_error(name, err) {
    return { ok: false, msg: `${name} -- ${err}` } },

  test_result(name, kind, result, ts) {
    let ts_msg = ts >= this.ms_threshold
      ? ` [${(.001*ts[0]).toFixed(3)}s]`
      : ''

    console.log(`  ${result.ok ? 'ok' : 'fail'}${ts_msg}: ${result.msg}`)
    this.ans.result = result },
}
